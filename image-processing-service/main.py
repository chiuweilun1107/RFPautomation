# -*- coding: utf-8 -*-
from fastapi import FastAPI, Response, Request, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from typing import List, Optional
import io
import sys
import numpy as np
import cv2
from PIL import Image

# IOPaint Integration
# We attempt import here. If it fails, get_lama will handle it.
try:
    from iopaint.model import LaMa
    from iopaint.schema import InpaintRequest
except ImportError as e:
    print(f"IOPaint Import Error: {e}")
    import traceback
    traceback.print_exc()
    LaMa = None
    InpaintRequest = None

# Global Inpaint Model
lama_model = None

class InpaintService:
    def __init__(self, device='cpu'):
        model_name = os.getenv("INPAINT_MODEL", "lama").lower()
        print(f"Initializing IOPaint model '{model_name}' on {device}...")
        
        if LaMa is None:
             raise ImportError("IOPaint not installed. Please add 'iopaint' to requirements.txt")

        if model_name == "mat":
            from iopaint.model import MAT
            self.model = MAT(device=device)
        elif model_name == "migan":
            from iopaint.model import MIGAN
            self.model = MIGAN(device=device)
        elif model_name == "sd":
            from iopaint.model import SD15
            from types import SimpleNamespace
            # SD requires model_info with .path attribute
            info = SimpleNamespace(
                name="SD15",
                path="runwayml/stable-diffusion-inpainting",
                model_type="diffusers_sd",
                is_single_file_diffusers=False
            )
            self.model = SD15(device=device, low_mem=True, model_info=info)
        else:
            self.model = LaMa(device=device)
            
        print(f"IOPaint {model_name.upper()} model loaded.")

    async def __call__(self, image: Image.Image, bboxes: List[List[int]]):
        MAX_ROI_DIM = 1024 if os.getenv("INPAINT_MODEL") == "sd" else 1280
        SOLID_COLOR_THRESHOLD = 5.0 # Low standard deviation implies solid color
        
        # Helper for a single crop inpaint
        def run_inpaint(img_crop, mask_crop):
            img_np = np.array(img_crop).astype(np.uint8)
            mask_np = np.array(mask_crop)
            if mask_np.ndim == 3:
                mask_np = cv2.cvtColor(mask_np, cv2.COLOR_RGB2GRAY)
            mask_np = np.where(mask_np > 127, 255, 0).astype(np.uint8)


            config = InpaintRequest()
            res_np = self.model(img_np, mask_np, config)
            
            # Fix for possible float64 return from LaMa
            res_np = res_np.astype(np.uint8)
            # LaMa returns BGR, convert to RGB for PIL
            res_np = cv2.cvtColor(res_np, cv2.COLOR_BGR2RGB)
            
            return Image.fromarray(res_np)

        result_image = image.copy()
        
        # If no bboxes, return original
        if not bboxes:
            return result_image

        print(f"Starting multi-inpaint for {len(bboxes)} boxes...")
        
        # Helper to check for solid color
        img_full_np = np.array(image)

        def get_smart_mask(img_crop_np, roi_box):
            """
            Returns: binary mask (uint8) where 255 is text, 0 is background.
            """
            gray = cv2.cvtColor(img_crop_np, cv2.COLOR_RGB2GRAY)
            
            # Adaptive Threshold
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                           cv2.THRESH_BINARY_INV, 15, 10)
            
            ry1, rx1, ry2, rx2 = roi_box
            roi_mask = np.zeros_like(thresh)
            roi_mask[ry1:ry2, rx1:rx2] = 255
            
            features = cv2.bitwise_and(thresh, roi_mask)
            contours, _ = cv2.findContours(features, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            final_mask = np.zeros_like(thresh)
            
            h, w = img_crop_np.shape[:2]
            
            for cnt in contours:
                x, y, cw, ch = cv2.boundingRect(cnt)
                
                # --- STRUCTURE FILTERING ---
                # 1. Border Touch (Lines extending out)
                pad_margin = 2
                touches_border = (x < pad_margin) or (y < pad_margin) or \
                                 (x + cw > w - pad_margin) or (y + ch > h - pad_margin)
                                 
                # 2. Aspect Ratio (Thin lines)
                ar = float(cw) / ch if ch > 0 else 0
                is_line_shape = (ar > 8) or (ar < 0.12) # Tuned slightly
                
                # 3. Large Component (Frames, big arrows) -> NEW
                # If a single component takes up significant width/height of the CROP
                # (Note: Use crop dims, not box dims, for safety, or box dims?)
                # ROI Box dims:
                bw, bh = rx2-rx1, ry2-ry1
                is_large = (cw > 0.6 * bw) or (ch > 0.6 * bh)

                if touches_border or is_line_shape or is_large:
                    continue # Structure -> Exclude from mask (preserve)
                else:
                    cv2.drawContours(final_mask, [cnt], -1, 255, -1)
                    
            # Dilate slightly for text thickness
            kernel = np.ones((3,3), np.uint8)
            final_mask = cv2.dilate(final_mask, kernel, iterations=1)
            
            if cv2.countNonZero(final_mask) == 0:
                 # Fallback: If no smart features found, do NOT mask the whole box (safest).
                 # Or mask the center 50%?
                 # Let's mask the ROI but erode it to be safe?
                 # No, if empty, return empty -> No inpainting.
                 # Better than destroying structure.
                 pass
                 
            return final_mask

        for i, box in enumerate(bboxes):
            y1, x1, y2, x2 = box
            
            pad = 64
            ry1 = max(0, y1 - pad)
            rx1 = max(0, x1 - pad)
            ry2 = min(image.height, y2 + pad)
            rx2 = min(image.width, x2 + pad)
            
            crop_w = rx2 - rx1
            crop_h = ry2 - ry1
            
            img_crop = result_image.crop((rx1, ry1, rx2, ry2))
            img_crop_np = np.array(img_crop)
            
            box_in_crop = [y1 - ry1, x1 - rx1, y2 - ry1, x2 - rx1]

            # Analysis
            check_pad = 5
            h_full, w_full, _ = img_full_np.shape
            cy1, cx1 = max(0, y1 - check_pad), max(0, x1 - check_pad)
            cy2, cx2 = min(h_full, y2 + check_pad), min(w_full, x2 + check_pad)
            roi_check = img_full_np[cy1:cy2, cx1:cx2]
            
            iy1, ix1 = y1 - cy1, x1 - cx1
            iy2, ix2 = y2 - cy1, x2 - cx1
            
            mask_border = np.ones(roi_check.shape[:2], dtype=bool)
            if iy2 > iy1 and ix2 > ix1:
                mask_border[iy1:iy2, ix1:ix2] = False
                
            border_pixels = roi_check[mask_border]
            
            is_solid = False
            avg_color = None
            mean_std = 100.0
            max_diff = 255

            if border_pixels.size > 0:
                std_devs = np.std(border_pixels, axis=0)
                mean_std = np.mean(std_devs)
                ptp = np.ptp(border_pixels, axis=0)
                max_diff = np.max(ptp)

                # Relaxed Solid threshold because Smart Mask protects us
                # But keep tight for gradients
                if mean_std < SOLID_COLOR_THRESHOLD and max_diff < 15:
                    is_solid = True
                    avg_color = np.mean(border_pixels, axis=0).astype(int)
                    # print(f"Box {i} SOLID (std={mean_std:.2f}, diff={max_diff}).")

            # Smart Mask
            mask_crop_np = get_smart_mask(img_crop_np, box_in_crop)
            mask_crop = Image.fromarray(mask_crop_np)
            
            # Skip if mask is empty (Nothing to remove)
            if cv2.countNonZero(mask_crop_np) == 0:
                print(f"Box {i}: Empty smart mask. Skipping (Preserving structure).")
                continue

            if is_solid and avg_color is not None:
                # 1. SOLID FILL
                fill_color = tuple(map(int, avg_color))
                solid_patch = Image.new("RGB", (crop_w, crop_h), fill_color)
                img_crop.paste(solid_patch, mask=mask_crop)
                result_image.paste(img_crop, (rx1, ry1))
                continue 

            # 2. TEXTURE CHECK -> CHOICE: TELEA or LAMA
            # Heuristic: If background is relatively smooth (low noise), use Telea.
            # Telea is perfect for text on slides/diagrams.
            # LaMa is for complex photos.
            
            # Threshold: 30.0 std is quite noisy. < 30 usually simple/gradient.
            if mean_std < 30.0:
                # --- CV2 TELEA INPAINTING ---
                # print(f"Box {i} SMOOTH (std={mean_std:.2f}). Using Telea.")
                # Telea needs the mask context. 
                # img_crop_np is RGB. cv2 needs BGR usually? No, inpaint works on any 3-channel.
                # But best to be consistent.
                
                # radius: 3px is good for text strokes.
                inp_res = cv2.inpaint(img_crop_np, mask_crop_np, 3, cv2.INPAINT_TELEA)
                
                res_img = Image.fromarray(inp_res)
                result_image.paste(res_img, (rx1, ry1))
                continue

            # 3. FALLBACK: LaMa (Complex Texture)
            print(f"Box {i} TEXTURED (std={mean_std:.2f}). Using LaMa.")
            
            scale = 1.0
            if max(crop_w, crop_h) > MAX_ROI_DIM:
                scale = MAX_ROI_DIM / max(crop_w, crop_h)
                
            img_crop_input = img_crop
            mask_crop_input = mask_crop

            if scale != 1.0:
                img_crop_input = img_crop.resize((int(crop_w*scale), int(crop_h*scale)), Image.BILINEAR)
                mask_crop_input = mask_crop.resize((int(crop_w*scale), int(crop_h*scale)), Image.NEAREST)

            try:
                res_crop = run_inpaint(img_crop_input, mask_crop_input)
                
                if scale != 1.0:
                    res_crop = res_crop.resize((crop_w, crop_h), Image.LANCZOS)
                
                # Smart Mask Paste: Only paste the inpainted pixels?
                # No, LaMa hallucinates context. We want the full generated patch usually.
                # BUT, if LaMa hallucinates badly outside the mask...
                # Actually, standard LaMa usage is: replace Masked area with LaMa output, keep rest original.
                # My `img_crop.paste(res_crop)` replaces EVERYTHING.
                # Wait! LaMa returns the WHOLE image inpainted?
                # YES. `run_inpaint` returns `Image.fromarray(res_np)`.
                # If I paste `res_crop` over `result_image`, I overwrite everything in the crop.
                # This is risky if LaMa changes unmasked pixels (it does a bit due to encoding/decoding).
                
                # CORRECT COMPOSITING:
                # Result = Original * (1-Mask) + Inpainted * Mask
                # This ensures unmasked structure (lines) is pixel-perfectly preserved from original!
                
                res_crop_np = np.array(res_crop)
                # Expand mask to 3 channels
                mask_3ch = np.stack([mask_crop_np]*3, axis=-1) / 255.0
                
                # Blend
                final_crop_np = (img_crop_np * (1 - mask_3ch) + res_crop_np * mask_3ch).astype(np.uint8)
                
                final_crop = Image.fromarray(final_crop_np)
                result_image.paste(final_crop, (rx1, ry1))
                
                if (i+1) % 10 == 0:
                    print(f"Processed {i+1}/{len(bboxes)} boxes...")
            except Exception as e:
                print(f"Failed box {i}: {e}")
                import traceback
                traceback.print_exc()
                
        return result_image

def get_lama():
    global lama_model
    if lama_model is None:
        try:
            lama_model = InpaintService(device='cpu')
        except Exception as e:
            print(f"LaMa/IOPaint initialization failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    return lama_model

# Global OCR engine instance
ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            # Initialize RapidOCR (default uses CPU via ONNXRuntime)
            ocr_engine = RapidOCR()
            print("RapidOCR initialized successfully.")
        except ImportError:
            print("RapidOCR dependencies not found.")
            return None
        except Exception as e:
            print(f"Failed to initialize RapidOCR: {e}")
            return None
    return ocr_engine

app = FastAPI(title="Image Processing Worker")

# CORS Setup - Very permissive for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True, # Allow credentials (cookies/headers)
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_utils():
    """Lazy-load utils that depend on cv2/numpy"""
    from utils.image_processing import remove_background, create_mask, crop_object
    try:
        from utils.ppt_generator import generate_pptx_from_data
    except ImportError:
        generate_pptx_from_data = None
    return remove_background, create_mask, crop_object, generate_pptx_from_data

class MaskRequest(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    bboxes: List[List[int]] # [[ymin, xmin, ymax, xmax], ...]
    image_url: Optional[str] = None
    image: Optional[str] = None # Base64 fallback
    normalized: bool = False # Default False (Absolute pixels) for Local OCR

class OcrRequest(BaseModel):
    image_url: Optional[str] = None
    image: Optional[str] = None # Base64 fallback

class PptxRequest(BaseModel):
    width: int
    height: int
    layers: List[dict]

def get_image_bytes(image_url: Optional[str] = None, image_base64: Optional[str] = None) -> bytes:
    """Helper to get image bytes from URL or Base64."""
    if image_url:
        response = requests.get(image_url)
        response.raise_for_status()
        return response.content
    elif image_base64:
        import base64
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        return base64.b64decode(image_base64)
    raise ValueError("Neither image_url nor image (base64) provided")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "python-worker"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/rembg")
def api_remove_background(file: bytes = File(None), image_url: Optional[str] = Form(None)):
    try:
        remove_background, _, _, _ = get_utils()
        if image_url:
            image_data = get_image_bytes(image_url=image_url)
        else:
            image_data = file
        
        if not image_data:
            return {"error": "No image provided"}
            
        result = remove_background(image_data)
        return Response(content=result, media_type="image/png")
    except Exception as e:
        return {"error": str(e)}

@app.post("/mask")
def api_create_mask(req: MaskRequest):
    try:
        _, create_mask, _, _ = get_utils()
        result = create_mask(req.width, req.height, req.bboxes)
        return Response(content=result, media_type="image/png")
    except Exception as e:
         return {"error": str(e)}

@app.post("/inpaint")
async def api_inpaint(req: MaskRequest):
    try:
        # 1. Get image bytes
        image_data = get_image_bytes(image_url=req.image_url, image_base64=req.image)
        img_pil = Image.open(io.BytesIO(image_data)).convert("RGB")
        width, height = img_pil.size
        
        # 2. Prepare Bboxes
        final_bboxes = []
        for bbox in req.bboxes:
            if req.normalized:
                # Azure OpenAI box_2d is normalized [0, 1000]
                ymin_norm, xmin_norm, ymax_norm, xmax_norm = bbox
                ymin = int((ymin_norm / 1000.0) * height)
                xmin = int((xmin_norm / 1000.0) * width)
                ymax = int((ymax_norm / 1000.0) * height)
                xmax = int((xmax_norm / 1000.0) * width)
                final_bboxes.append([ymin, xmin, ymax, xmax])
            else:
                final_bboxes.append([int(v) for v in bbox])

        # 3. Get Inpaint Service (LaMa + Hybrid)
        lama_service = get_lama()
        if lama_service is None:
             return {"error": "Inpaint model not ready"}

        # 4. Process
        # The service is async callable? No, InpaintService.__call__ is defined as standard async method?
        # Let's check definition: async def __call__(self, image: Image.Image, bboxes: List[List[int]]):
        result_image = await lama_service(img_pil, final_bboxes)
        
        # 5. Return Result
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format="PNG")
        return Response(content=output_buffer.getvalue(), media_type="image/png")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/ocr")
def api_ocr(req: OcrRequest):
    try:
        ocr = get_ocr_engine()
        if ocr is None:
            return {"error": "OCR engine not ready"}
            
        # Get image bytes
        image_data = get_image_bytes(image_url=req.image_url, image_base64=req.image)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("OCR Error: cv2.imdecode returned None")
            return {"error": "Could not decode image"}
            
        print(f"OCR Debug: Image shape: {img.shape}", flush=True)
        print(f"OCR Debug: Image mean: {img.mean()}", flush=True)
        
        # RapidOCR inference
        # result is a list of [ [ [[x1,y1],[x2,y2],[x3,y3],[x4,y4]], text, confidence ], ... ]
        result, elapse = ocr(img)
        print(f"OCR Debug: Result len: {len(result) if result else 0}", flush=True)
        
        text_blocks = []
        if result:
            for line in result:
                # RapidOCR format: line = [box, text, score]
                box, text, score = line
                
                # Box is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
                # Flatten to standard bounding box [ymin, xmin, ymax, xmax] (absolute)
                xs = [p[0] for p in box]
                ys = [p[1] for p in box]
                xmin, ymin, xmax, ymax = min(xs), min(ys), max(xs), max(ys)
                
                text_blocks.append({
                    "text": text,
                    "box_2d": [int(ymin), int(xmin), int(ymax), int(xmax)],
                    "confidence": float(score)
                })
        
        return {"text_blocks": text_blocks}

    except Exception as e:
        import traceback
        print(f"OCR error: {e}")
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/crop")
def api_crop(file: bytes = File(None), image_url: Optional[str] = Form(None), ymin: int = Form(...), xmin: int = Form(...), ymax: int = Form(...), xmax: int = Form(...)):
    try:
        if image_url:
            image_data = get_image_bytes(image_url=image_url)
        else:
            image_data = file
            
        if not image_data:
            return {"error": "No image provided"}

        bbox = [ymin, xmin, ymax, xmax]
        _, _, crop_object, _ = get_utils()
        result = crop_object(image_data, bbox)
        return Response(content=result, media_type="image/png")
    except Exception as e:
        return {"error": str(e)}

@app.post("/pptx")
def api_generate_pptx(req: PptxRequest):
    try:
        _, _, _, generate_pptx_from_data = get_utils()
        if generate_pptx_from_data is None:
            return {"error": "PPTX generation is disabled due to missing dependencies"}
        data = req.dict()
        file_content = generate_pptx_from_data(data)
        return Response(
            content=file_content,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": "attachment; filename=generated.pptx"}
        )
    except Exception as e:
        return {"error": str(e)}

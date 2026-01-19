import os
import shutil
import base64
import tempfile
import time
import re
import subprocess
from pathlib import Path
from typing import List, Optional, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import json

# Docling Imports
from docling.document_converter import (
    DocumentConverter,
    PdfFormatOption,
    WordFormatOption,
    ImageFormatOption,
    FormatOption,
    InputFormat,
)
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode, TableStructureOptions

def get_converter():
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = 3.0  # Increased for better table line detection 
    pipeline_options.generate_page_images = True 
    pipeline_options.generate_picture_images = True
    pipeline_options.generate_table_images = True
    pipeline_options.do_ocr = False # Disabled by user request
    pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
    
    print(f"DEBUG: Initializing Converter. OCR Enabled: {pipeline_options.do_ocr}", flush=True)
    
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            InputFormat.DOCX: WordFormatOption(),
            InputFormat.IMAGE: ImageFormatOption(),
        }
    )

converter = get_converter()

# --- Pydantic Models ---

class BBox(BaseModel):
    l: float
    t: float
    r: float
    b: float

class TableItem(BaseModel):
    table_index: int
    num_rows: int
    num_cols: int
    data: List[List[str]]
    html: str
    bbox: Optional[BBox] = None
    page: int = 0
    image: Optional[str] = None  # Table image URL

class ContentItem(BaseModel):
    type: str  # "text", "table", "image", etc.
    text: Optional[str] = None
    bbox: Optional[BBox] = None

class PageItem(BaseModel):
    page: int
    content: str
    images: List[str] = []
    screenshot_url: Optional[str] = None
    screenshot_base64: Optional[str] = None
    is_toc_candidate: bool = False
    items: List[ContentItem] = []

class ParseResponse(BaseModel):
    pages: List[PageItem]
    doc_markdown: str
    images: List[str]
    tables: List[TableItem]

# --- FastAPI App & Configuration ---

app = FastAPI(title="Parsing Service")

# 🔍 Middleware 來捕獲所有請求
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 只記錄 /parse-storage 的請求
        if request.url.path == "/parse-storage":
            body = await request.body()
            print(f"\n{'='*70}")
            print(f"🔍 原始請求 (parse-storage):")
            print(f"   URL: {request.url}")
            print(f"   Method: {request.method}")
            print(f"   Headers: {dict(request.headers)}")
            print(f"   Raw Body: {body}")
            try:
                body_json = json.loads(body)
                print(f"   Parsed JSON: {json.dumps(body_json, indent=4)}")
            except:
                print(f"   無法解析為 JSON")
            print(f"{'='*70}\n")

        response = await call_next(request)
        return response

app.add_middleware(RequestLoggingMiddleware)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
STORAGE_BUCKET = "generated-images"

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")
else:
    print("⚠️  Supabase not configured")

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_model = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        from google.generativeai.types import HarmCategory, HarmBlockThreshold
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Gemini model initialized")
    except Exception as e:
        print(f"⚠️  Gemini initialization failed: {e}")
else:
    print("⚠️  Gemini API key not configured")

# Temporary Directory
TMP_DIR = Path(tempfile.gettempdir()) / "parsing_service"
TMP_DIR.mkdir(exist_ok=True)

TMP_DIR.mkdir(exist_ok=True)

# --- ODT Conversion Helper ---

# --- Office Conversion Helper ---

def convert_legacy_format(file_path: Path) -> Path:
    """
    Converts legacy Office files (.doc, .xls, .ppt) and ODT to their modern XML counterparts
    (.docx, .xlsx, .pptx) using LibreOffice (soffice).
    Returns the path to the converted file.
    """
    ext = file_path.suffix.lower()
    conversion_map = {
        ".doc": "docx",
        ".odt": "docx",
        ".xls": "xlsx",
        ".ppt": "pptx"
    }
    
    if ext not in conversion_map:
        return file_path

    target_fmt = conversion_map[ext]
    print(f"DEBUG: Converting {file_path} (format: {ext}) to {target_fmt} using LibreOffice...")
    
    try:
        # libreoffice --headless --convert-to docx --outdir /tmp/dir file.doc
        # Note: --outdir is required to control where it goes
        out_dir = file_path.parent
        
        cmd = [
            "libreoffice", "--headless",
            "--convert-to", target_fmt,
            "--outdir", str(out_dir),
            str(file_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Determine new filename
        new_path = file_path.with_suffix(f".{target_fmt}")
        
        if new_path.exists():
            print(f"DEBUG: Conversion successful. Created {new_path}")
            return new_path
        else:
             print(f"ERROR: LibreOffice finished but {new_path} not found.")
             # Fallback check for weird LibreOffice naming behavior? Usually robust.
             return file_path
             
    except subprocess.CalledProcessError as e:
        print(f"ERROR: LibreOffice conversion failed: {e.stderr.decode() if e.stderr else e}")
        # Identify if tool is missing
        if e.stderr and "not found" in e.stderr.decode():
             raise HTTPException(500, "LibreOffice not installed on server")
        # Warn but return original (maybe docling can try?)
        return file_path
    except FileNotFoundError:
        print("ERROR: LibreOffice (soffice) command not found.")
        # Fallback to verify if pandoc can help? No, pandoc sucks for doc.
        return file_path

# --- TOC Detection Helper ---

def is_table_actually_toc(table_data: List[List[str]], page_text: str = "") -> bool:
    """
    檢測表格是否實際上是目錄（被 Docling 誤判為表格）

    判斷依據：
    1. 表格內容包含目錄關鍵字（壹、貳、參、一、二、三、目錄等）
    2. 最後一列通常是頁碼
    3. 行數較多（目錄通常有多個條目）
    4. 頁面文字包含「目錄」、「Table of Contents」等關鍵字
    """
    if not table_data or len(table_data) < 3:  # 至少要有 3 行才可能是目錄
        return False

    # 檢查頁面文字是否包含目錄關鍵字
    has_toc_keyword = any(keyword in page_text for keyword in ["目錄", "Table of Contents", "INDEX", "CONTENTS"])

    # 檢查表格內容
    toc_indicators = 0
    total_cells = 0

    # 中文數字和章節標記
    toc_patterns = [
        r'[壹貳參肆伍陸柒捌玖拾]、',  # 壹、貳、參
        r'^[一二三四五六七八九十]+、',  # 一、二、三
        r'^\d+\.\d+',  # 1.1, 1.2
        r'第[一二三四五六七八九十]+章',  # 第一章
        r'Chapter\s+\d+',  # Chapter 1
        r'^\([一二三四五六七八九十]+\)',  # (一)、(二)
    ]

    for row in table_data:
        for cell in row:
            cell_str = str(cell).strip()
            total_cells += 1

            # 檢查是否符合目錄模式
            for pattern in toc_patterns:
                if re.search(pattern, cell_str):
                    toc_indicators += 1
                    break

            # 檢查是否包含頁碼（純數字，通常在 1-999 範圍）
            if re.match(r'^\d{1,3}$', cell_str):
                toc_indicators += 0.5  # 頁碼權重較低

    # 判斷邏輯：
    # 1. 如果頁面有目錄關鍵字 + 表格有 30% 以上的目錄指標 → 是目錄
    # 2. 如果表格有 50% 以上的目錄指標 → 是目錄
    toc_ratio = toc_indicators / max(total_cells, 1)

    if has_toc_keyword and toc_ratio > 0.3:
        print(f"[TOC Detection] Table identified as TOC (keyword + {toc_ratio:.1%} indicators)")
        return True

    if toc_ratio > 0.5:
        print(f"[TOC Detection] Table identified as TOC ({toc_ratio:.1%} indicators)")
        return True

    return False

# --- TOC Repair Logic using Gemini ---

def repair_toc_with_gemini(page_image_path: str, page_num: int) -> Optional[str]:
    """
    Sends the page image to Gemini to extract TOC as Markdown list.
    Returns Markdown string if successful, None otherwise.
    """
    if not gemini_model: 
        return None

    try:
        print(f"[TOC Repair] Sending Page {page_num} to Gemini...")
        file_ref = genai.upload_file(page_image_path)
        
        # Poll for processing
        while file_ref.state.name == "PROCESSING":
            time.sleep(1)
            file_ref = genai.get_file(file_ref.name)
            
        prompt = """
        This image contains a Table of Contents (or Index).
        Strictly extract the content as a nested Markdown list.
        Format: - [Chapter Name] ... [Page Number]
        Do NOT create a table. Do NOT add any preamble or explanation.
        Just output the clean Markdown list.
        If this is NOT a Table of Contents, just output 'NOT_TOC'.
        """
        
        response = gemini_model.generate_content(
            [file_ref, prompt],
            safety_settings={
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
        
        text = response.text.strip()
        if text == "NOT_TOC":
            print(f"[TOC Repair] Gemini said Page {page_num} is NOT a TOC.")
            return None
            
        print(f"[TOC Repair] Successfully repaired TOC for Page {page_num}")
        return text

    except Exception as e:
        print(f"[TOC Repair] Error: {e}")
        return None

# --- Core Processing Logic ---

async def process_conversion_result(doc, safe_name_stem="doc") -> ParseResponse:
    full_md = doc.export_to_markdown()
    timestamp = int(time.time())

    # 1. Structure Tables with BBox
    tables_data = []

    # We map table objects to their IDs to find page numbers later
    table_id_map = {}

    for i, tab in enumerate(doc.tables):
        try:
            df = tab.export_to_dataframe(doc)
            # Clean grid: Revert to standard processing
            if not df.empty:
                 grid = df.fillna("").astype(str).values.tolist()
            else:
                 grid = []

            if not df.columns.empty and not all(str(c).isdigit() for c in df.columns):
                 grid.insert(0, df.columns.tolist())

            # Get BBox and Page
            bbox_obj = None
            page_no = 0
            if tab.prov and tab.prov[0]:
                prov = tab.prov[0]
                page_no = prov.page_no
                if hasattr(prov, "bbox"):
                   bbox_obj = BBox(l=prov.bbox.l, t=prov.bbox.t, r=prov.bbox.r, b=prov.bbox.b)

            t_item = TableItem(
                table_index=i,
                num_rows=len(grid),
                num_cols=len(grid[0]) if grid else 0,
                data=grid,
                html=tab.export_to_html(doc),
                bbox=bbox_obj,
                page=page_no
            )
            tables_data.append(t_item)
            table_id_map[id(tab)] = t_item # Store reference

        except Exception as e:
            print(f"Error extracting table {i}: {e}")

    # 2. Upload Images (Pictures + Tables)
    img_urls = []
    picture_urls = {} # map id(pic) -> url
    
    async def upload_image(pil_img, prefix):
        if not pil_img: return None
        img_name = f"{safe_name_stem}_{timestamp}_{prefix}.png"
        img_path = f"generated/{img_name}" # Use a folder
        
        with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
            pil_img.save(tmp.name, format="PNG")
            with open(tmp.name, "rb") as f:
                img_bytes = f.read()
        
        if supabase:
            try:
                supabase.storage.from_(STORAGE_BUCKET).upload(
                    path=img_path, file=img_bytes, 
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                return supabase.storage.from_(STORAGE_BUCKET).get_public_url(img_path)
            except Exception as e:
                print(f"Upload failed: {e}")
        return None

    # Upload Pictures
    for i, pic in enumerate(doc.pictures):
        url = await upload_image(pic.image.pil_image if pic.image else None, f"pic_{i}")
        if url:
            picture_urls[id(pic)] = url
            img_urls.append(url)

    # Upload Table Images
    table_image_urls = {}
    for i, tab in enumerate(doc.tables):
        url = await upload_image(tab.image.pil_image if tab.image else None, f"table_{i}")
        if url:
             table_image_urls[id(tab)] = url
        if url and id(tab) in table_id_map:
             table_id_map[id(tab)].image = url

    # V2: Upload Full Page Images (Enabled for n8n External LLM Node)
    full_page_urls = {}
    # Optimization: We will lazy-load/upload page images only if they are TOC candidates
    
    import re
    # 3. Patch full_md with real URLs
    processed_full_md = full_md
    for url in img_urls:
        if "<!-- image -->" in processed_full_md:
            processed_full_md = processed_full_md.replace("<!-- image -->", f"\n\n![Image]({url})\n\n", 1)
        else:
            processed_full_md = re.sub(r"!\[.*?\]\(.*?\.(?:png|jpg|jpeg)\)", f"![Image]({url})", processed_full_md, count=1)

    # 4. Combine and Sort all items to preserve reading order
    all_items = []
    for t in doc.texts: 
        all_items.append(('text', t))
    for p in doc.pictures: 
        all_items.append(('pic', p))
    for tb in doc.tables: 
        all_items.append(('table', tb))

    def get_sort_key(item_tuple):
        _, item = item_tuple
        if not item.prov: return (0, 0, 0)
        p = item.prov[0]
        # Docling Coordinates: (l, t, r, b) where larger 't' means higher on page
        t_coord = getattr(p.bbox, 't', 0)
        l_coord = getattr(p.bbox, 'l', 0)
        return (p.page_no, -t_coord, l_coord) 

    all_items.sort(key=get_sort_key)

    # 5. Group by Page
    page_contents = {pno: [] for pno in doc.pages.keys()}
    page_images_map = {pno: [] for pno in doc.pages.keys()}
    
    def get_md_text(item):
        text = getattr(item, 'text', str(item))
        label = str(getattr(item, 'label', '')).lower()
        if 'title' in label: return f"# {text}"
        if 'section' in label: return f"## {text}"
        if 'heading' in label: return f"### {text}"
        return text

    # 先收集每頁的文字內容（用於 TOC 檢測）
    page_text_for_detection = {pno: [] for pno in doc.pages.keys()}
    for t in doc.texts:
        if t.prov:
            p_no = t.prov[0].page_no
            if p_no in page_text_for_detection:
                page_text_for_detection[p_no].append(t.text)

    # 同時收集表格的文字內容（目錄可能被誤判為表格）
    for tb in doc.tables:
        if tb.prov:
            p_no = tb.prov[0].page_no
            if p_no in page_text_for_detection:
                try:
                    # 從表格中提取所有文字
                    df = tb.export_to_dataframe(doc)
                    table_text = " ".join(df.fillna("").astype(str).values.flatten())
                    page_text_for_detection[p_no].append(table_text)
                except:
                    pass

    for kind, item in all_items:
        try:
            # Safely get page number
            if not item.prov or not isinstance(item.prov, list) or not item.prov:
                continue
            p_no = item.prov[0].page_no
            if p_no not in page_contents: continue

            if kind == 'text':
                page_contents[p_no].append(get_md_text(item))
            elif kind == 'pic':
                url = picture_urls.get(id(item))
                if url:
                    page_contents[p_no].append(f"![Image]({url})")
                    page_images_map[p_no].append(url)
            elif kind == 'table':
                # 檢查表格是否實際上是目錄
                try:
                    df = item.export_to_dataframe(doc)
                    table_data = df.fillna("").astype(str).values.tolist()
                    page_text = "\n".join(page_text_for_detection.get(p_no, []))

                    if is_table_actually_toc(table_data, page_text):
                        # 將表格轉換為文字列表（目錄格式）
                        print(f"[TOC Detection] Converting table to TOC format on page {p_no}")
                        for row in table_data:
                            row_text = " ".join([str(cell).strip() for cell in row if str(cell).strip()])
                            if row_text:
                                page_contents[p_no].append(row_text)
                    else:
                        # 正常的表格處理
                        page_contents[p_no].append(item.export_to_markdown())
                        url = table_image_urls.get(id(item))
                        if url: page_images_map[p_no].append(url)
                except Exception as table_err:
                    print(f"Error processing table on page {p_no}: {table_err}")
                    # Fallback: 使用原始 Markdown
                    page_contents[p_no].append(item.export_to_markdown())
                    url = table_image_urls.get(id(item))
                    if url: page_images_map[p_no].append(url)
        except Exception as e:
            print(f"Error in page reconstruction item: {e}")
            continue

    # Environment Flag for Internal Repair
    ENABLE_INTERNAL_REPAIR = os.environ.get("ENABLE_INTERNAL_TOC_REPAIR", "false").lower() == "true"

    pages_list = []

    # Group items by page for TOC detection
    page_items_map = {pno: [] for pno in doc.pages.keys()}
    for text_item in doc.texts:
         if text_item.prov:
             p = text_item.prov[0]
             page_items_map[p.page_no].append(text_item)

    # DOCX Fallback: If no pages detected (common for DOCX), treat as single page
    if len(doc.pages) == 0:
        print("[DOCX Fallback] No pages detected, treating entire document as single page")
        pages_list.append(PageItem(
            page=1,
            content=processed_full_md,
            images=img_urls,
            screenshot_url=None,
            screenshot_base64=None,
            is_toc_candidate=False,
            items=[]
        ))

        return ParseResponse(
            pages=pages_list,
            doc_markdown=processed_full_md,
            images=img_urls,
            tables=tables_data
        )

    # Process each page
    for pno, page in doc.pages.items():
        print(f"Constructing Page {pno}...")
        try:
             print(f"DEBUG: Page {pno} Image Ref: {page.image}, Has PIL: {bool(page.image and page.image.pil_image)}")
        except Exception as e:
             print(f"DEBUG: Could not inspect page image: {e}")

        # A. Check for TOC probability
        # 重要：使用 page_text_for_detection（包含表格文字）而非 page_items_map（只有 doc.texts）
        page_raw_text = "\n".join(page_text_for_detection.get(pno, []))

        is_toc_candidate = False

        # 優先檢查 Dockling 的 "Document Index" 標籤
        # 只接受 "document index"，不接受單獨的 "index"（太寬鬆）
        for text_item in page_items_map.get(pno, []):
            item_label = str(getattr(text_item, 'label', '')).lower()
            if 'document index' in item_label:
                is_toc_candidate = True
                print(f"DEBUG: Page {pno} detected as TOC by Dockling label: '{item_label}'")
                break

        # 如果還沒檢測到，檢查表格的標籤（目錄可能被誤判為表格）
        if not is_toc_candidate:
            for table_item in doc.tables:
                if table_item.prov and table_item.prov[0].page_no == pno:
                    table_label = str(getattr(table_item, 'label', '')).lower()
                    if 'document index' in table_label:
                        is_toc_candidate = True
                        print(f"DEBUG: Page {pno} detected as TOC by table label: '{table_label}'")
                        break

        # 不使用關鍵字檢測，只依賴 Docling 的 label 判斷
        # is_toc_candidate 已經在上面通過 label 檢測設定

        print(f"DEBUG: Page {pno} is_toc_candidate: {is_toc_candidate}")
        if len(page_raw_text) > 0:
            print(f"DEBUG: Page {pno} Text Snippet: {page_raw_text[:150]}...")  # 啟用文字預覽
        else:
            print(f"DEBUG: Page {pno} has NO text content!")

        final_page_content = ""
        structured_items = []

        # TOC Repair Logic
        toc_repaired = False
        screenshot_url_val = None
        screenshot_base64_val = None # Init
        
        # ... (Internal Repair skipped if env not set) ...

        # 2. External Repair Prep (Upload Image if Candidate)
        current_page_images = page_images_map[pno] 
        
        if is_toc_candidate and not toc_repaired:
            print(f"DEBUG: Attempting to upload screenshot for Page {pno}")
            # Upload this specific page image for n8n to use
            if page.image and page.image.pil_image:
                img_name = f"{safe_name_stem}_{timestamp}_page_{pno}.png"
                img_path = f"{safe_name_stem}/{img_name}"
                
                if supabase:
                    try:
                        with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
                            # V16 Optimization: More aggressive resizing to 1000px to ensure < 1min inference
                            pil_img = page.image.pil_image
                            max_dim = 1000
                            if max(pil_img.size) > max_dim:
                                print(f"DEBUG: Resizing image from {pil_img.size} to max {max_dim}")
                                pil_img.thumbnail((max_dim, max_dim))
                            
                            pil_img.save(tmp.name, format="PNG")
                            with open(tmp.name, "rb") as f:
                                img_bytes = f.read()
                        
                        print(f"DEBUG: Generating Base64 for Page {pno}")
                        # Generate Base64 for Ollama
                        screenshot_base64_val = base64.b64encode(img_bytes).decode('utf-8')
                        print(f"DEBUG: Base64 Length: {len(screenshot_base64_val)}")

                        try:
                            supabase.storage.from_(STORAGE_BUCKET).upload(
                                path=img_path, file=img_bytes, 
                                file_options={"content-type": "image/png", "upsert": "true"}
                            )
                            public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(img_path)
                            print(f"DEBUG: Generated Screenshot URL: {public_url}")
                            screenshot_url_val = public_url
                        except Exception as upload_err:
                            print(f"DEBUG: Supabase upload failed but Base64 is safe: {upload_err}")
                            # We continue because we have the Base64 for Ollama
                        
                    except Exception as e:
                        print(f"DEBUG: Failed to process screenshot image: {e}")

        # Standard Construction
        if not toc_repaired:
            items = page_contents.get(pno, [])
            final_page_content = "\n\n".join(items)
            if not final_page_content.strip():
                 final_page_content = "(No content detected)"

            # Populate Structured Items (Simplified for now)
            # structured_items.append(ContentItem(type="text", text=final_page_content))
            # In future: loop original items to preserve bboxes in standard output

        pages_list.append(PageItem(
            page=pno,
            content=final_page_content,
            images=current_page_images, 
            screenshot_url=screenshot_url_val,
            screenshot_base64=screenshot_base64_val,
            is_toc_candidate=is_toc_candidate,
            items=structured_items
        ))

    return ParseResponse(
        pages=pages_list,
        doc_markdown=processed_full_md, # Note: this is original full MD, might differ from pages if TOC repaired
        images=img_urls,
        tables=tables_data
    )


# --- Endpoints ---

class ParseStorageRequest(BaseModel):
    path: str
    bucket: str = "raw-files"

@app.post("/parse-storage", response_model=ParseResponse)
async def parse_from_storage(request: Request):
    """
    接收 parse-storage 請求並打印詳細信息，然後再解析為 ParseStorageRequest
    """
    # 🔍 先接收原始 request，打印詳細信息
    body_bytes = await request.body()
    print(f"\n{'='*70}")
    print(f"🔍 /parse-storage 原始請求:")
    print(f"   URL: {request.url}")
    print(f"   Method: {request.method}")
    print(f"   Content-Type: {request.headers.get('content-type')}")
    print(f"   Body (bytes): {body_bytes}")
    print(f"   Body (decoded): {body_bytes.decode('utf-8') if body_bytes else '(empty)'}")
    print(f"{'='*70}\n")

    # 再轉回 JSON 並驗證
    try:
        import json
        body_dict = json.loads(body_bytes) if body_bytes else {}
        print(f"   Body (JSON): {json.dumps(body_dict, indent=4)}")

        # 手動創建 ParseStorageRequest
        parse_request = ParseStorageRequest(
            path=body_dict.get('path', ''),
            bucket=body_dict.get('bucket', 'raw-files')
        )
        print(f"   ✅ Parsed as ParseStorageRequest:")
        print(f"      path: {parse_request.path}")
        print(f"      bucket: {parse_request.bucket}")
    except Exception as e:
        print(f"   ❌ 解析錯誤: {e}")
        raise

    request = parse_request

    if not supabase: raise HTTPException(500, "Supabase not configured")

    safe_name = Path(request.path).name
    temp_path = TMP_DIR / safe_name

    try:
        print(f"Downloading {request.path}...")
        res = supabase.storage.from_(request.bucket).download(request.path)
        if not TMP_DIR.exists():
            print(f"Directory {TMP_DIR} did NOT exist. Creating...")
            TMP_DIR.mkdir(parents=True, exist_ok=True)
        else:
            print(f"Directory {TMP_DIR} exists.")

        print(f"Writing file to {temp_path}...")
        with open(temp_path, 'wb') as f: f.write(res)
        
        # ODT Conversion
        # Office Conversion (doc/xls/odt -> docx/xlsx)
        temp_path = convert_legacy_format(temp_path)

        doc = converter.convert(temp_path).document
        return await process_conversion_result(doc)
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if temp_path.exists():
            if temp_path.is_dir():
                shutil.rmtree(temp_path)
            else:
                os.remove(temp_path)

@app.post("/parse", response_model=ParseResponse)
async def parse_direct(file: UploadFile = File(...)):
    """Direct upload endpoint for n8n/other tools"""
    safe_name = file.filename or "uploaded_doc"
    temp_path = TMP_DIR / safe_name
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Converting {safe_name}...")
        
        # ODT Conversion
        # Office Conversion (doc/xls/odt -> docx/xlsx)
        temp_path = convert_legacy_format(temp_path)

        doc = converter.convert(temp_path).document
        
        # Derive stem for file naming
        safe_name_stem = os.path.splitext(safe_name)[0]
        safe_name_stem = re.sub(r'[^a-zA-Z0-9_-]', '_', safe_name_stem)
        
        return await process_conversion_result(doc, safe_name_stem)

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(500, str(e))
    finally:
         if temp_path.exists(): os.remove(temp_path)

@app.get("/health")
def health():
    return {"status": "ok", "gemini": bool(gemini_model)}

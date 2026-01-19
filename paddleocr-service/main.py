from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import base64
import io
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

app = FastAPI(title="PaddleOCR Service")

# 初始化 PaddleOCR（支援中英文）
ocr = PaddleOCR(
    use_textline_orientation=False,  # 禁用方向分類器（避免坐標混亂）
    lang='ch'  # 中文模型（也支援英文）
)

class OCRRequest(BaseModel):
    image: str  # Base64 編碼的圖片
    image_url: Optional[str] = None

class OCRResponse(BaseModel):
    success: bool
    bboxes: List[List[int]]  # [[ymin, xmin, ymax, xmax], ...]
    texts: List[str]  # 識別的文字內容
    confidences: List[float]  # 信心度
    total_boxes: int

def load_image_from_base64(base64_str: str) -> np.ndarray:
    """從 base64 字串載入圖片"""
    # 移除 data URL header
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    # 解碼 base64
    image_data = base64.b64decode(base64_str)
    image = Image.open(io.BytesIO(image_data))

    # 轉換為 RGB（PaddleOCR 需要）
    if image.mode != 'RGB':
        image = image.convert('RGB')

    # 轉換為 numpy array
    return np.array(image)

def convert_bbox_to_xyxy(box: List[List[int]]) -> List[int]:
    """
    將 PaddleOCR 的框轉換為 [ymin, xmin, ymax, xmax] 格式
    PaddleOCR 3.x 返回的 rec_polys 格式: numpy array [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
    """
    # 直接按照標準格式處理：每個點是 [x, y]
    x_coords = [point[0] for point in box]
    y_coords = [point[1] for point in box]

    xmin = int(min(x_coords))
    xmax = int(max(x_coords))
    ymin = int(min(y_coords))
    ymax = int(max(y_coords))

    # 返回 [ymin, xmin, ymax, xmax]
    return [ymin, xmin, ymax, xmax]

@app.get("/health")
def health():
    return {"status": "ok", "model": "PaddleOCR-ch"}

@app.post("/detect", response_model=OCRResponse)
def detect_text(request: OCRRequest):
    """
    偵測圖片中的文字區域
    """
    try:
        # 載入圖片
        image = load_image_from_base64(request.image)

        # 嘗試使用舊版 ocr() 方法而不是 predict()
        # 這可能返回更簡單、更正確的坐標
        original_height, original_width = image.shape[:2]
        print(f"DEBUG: 原始圖片尺寸: {original_width}x{original_height} (寬x高)")

        # 使用 predict() 方法（PaddleOCR 3.x 推薦的 API）
        result = ocr.predict(image)

        # 檢查結果格式
        print(f"DEBUG: result type: {type(result)}")
        print(f"DEBUG: result length: {len(result) if result else 0}")

        if not result or len(result) == 0:
            return OCRResponse(
                success=True,
                bboxes=[],
                texts=[],
                confidences=[],
                total_boxes=0
            )

        # 檢查第一層結果
        page_result = result[0]
        print(f"DEBUG: page_result type: {type(page_result)}")

        bboxes = []
        texts = []
        confidences = []

        # PaddleOCR 3.x 返回 OCRResult 對象
        # 需要通過 .json 屬性訪問實際數據
        if hasattr(page_result, 'json'):
            print(f"DEBUG: Detected OCRResult object (PaddleOCR 3.x)")
            json_data = page_result.json

            if isinstance(json_data, dict) and 'res' in json_data:
                res = json_data['res']

                # 獲取 OCR 結果
                dt_polys = res.get('dt_polys', [])  # 檢測到的多邊形
                rec_texts = res.get('rec_texts', [])  # 識別的文字
                rec_scores = res.get('rec_scores', [])  # 信心度分數

                print(f"DEBUG: 檢測到 {len(rec_texts)} 個文字區域")

                # 處理每個檢測結果
                for i, (text, score, poly) in enumerate(zip(rec_texts, rec_scores, dt_polys)):
                    if not poly or len(poly) < 4:
                        continue

                    print(f"DEBUG: [{i}] 文字='{text}', 信心度={score:.3f}")

                    # 從多邊形提取邊界框
                    x_coords = [point[0] for point in poly]
                    y_coords = [point[1] for point in poly]

                    xmin = int(min(x_coords))
                    xmax = int(max(x_coords))
                    ymin = int(min(y_coords))
                    ymax = int(max(y_coords))

                    # 轉換為 [ymin, xmin, ymax, xmax] 格式
                    bbox_xyxy = [ymin, xmin, ymax, xmax]

                    print(f"       提取bbox=[xmin={xmin}, ymin={ymin}, xmax={xmax}, ymax={ymax}] → {bbox_xyxy}")

                    bboxes.append(bbox_xyxy)
                    texts.append(text)
                    confidences.append(float(score))
            else:
                print(f"WARNING: Unexpected json structure: {json_data.keys() if isinstance(json_data, dict) else type(json_data)}")

        # 兼容 PaddleOCR 2.x 格式（列表格式）
        elif isinstance(page_result, list):
            print(f"DEBUG: Detected list format (PaddleOCR 2.x)")

            for line in page_result:
                # line 格式: [[[x1,y1], [x2,y2], [x3,y3], [x4,y4]], (text, confidence)]
                bbox_points = line[0]  # [[x1,y1], ...]
                text_info = line[1]    # (text, confidence)
                text = text_info[0]
                confidence = text_info[1]

                print(f"DEBUG: 文字='{text}', bbox_points={bbox_points}")

                # 從四個點提取矩形邊界
                x_coords = [point[0] for point in bbox_points]
                y_coords = [point[1] for point in bbox_points]

                xmin = int(min(x_coords))
                xmax = int(max(x_coords))
                ymin = int(min(y_coords))
                ymax = int(max(y_coords))

                # 轉換為我們需要的格式: [ymin, xmin, ymax, xmax]
                bbox_xyxy = [ymin, xmin, ymax, xmax]

                print(f"       提取bbox=[xmin={xmin}, ymin={ymin}, xmax={xmax}, ymax={ymax}] → {bbox_xyxy}")

                bboxes.append(bbox_xyxy)
                texts.append(text)
                confidences.append(float(confidence))
        else:
            print(f"ERROR: Unknown result format: {type(page_result)}")
            raise ValueError(f"Unsupported PaddleOCR result format: {type(page_result)}")

        return OCRResponse(
            success=True,
            bboxes=bboxes,
            texts=texts,
            confidences=confidences,
            total_boxes=len(bboxes)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 處理失敗: {str(e)}")

@app.post("/detect-merged", response_model=OCRResponse)
def detect_text_merged(request: OCRRequest):
    """
    偵測文字並合併相近的框（用於整段文字）
    """
    try:
        # 先執行標準偵測
        result = detect_text(request)

        if result.total_boxes == 0:
            return result

        # 簡單的合併策略：按 Y 座標分組，相近的行合併
        # 這裡保持原樣，可以根據需求實現更複雜的合併邏輯

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 處理失敗: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

"""
簡化版 PDF 目錄識別服務

使用 OCR 和簡單的規則提取目錄結構，避免依賴大型 ML 模型。
"""

import os
import io
import base64
import re
from typing import Optional, List, Dict
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from PIL import Image
import pytesseract

# 初始化 FastAPI
app = FastAPI(title="Simple TOC Service", version="1.0.0")

# 配置
DEVICE = "cpu"
MAX_IMAGE_SIZE = (2048, 2048)  # 最大圖片尺寸

# Tesseract 配置（支持中文）
# 需要在 Docker 中安裝中文語言包
TESSERACT_CONFIG = r'--oem 3 --psm 6'

print("Simple TOC Recognition Service initialized")


# 定義請求/回應模型
class TOCRequest(BaseModel):
    """目錄識別請求"""
    image: Optional[str] = None  # Base64 編碼的圖片
    image_url: Optional[str] = None  # 圖片 URL

class TOCEntry(BaseModel):
    """目錄條目"""
    level: int  # 層級 (1=主章節, 2=子章節, 3=次級章節)
    title: str  # 標題文字
    page_number: Optional[int] = None  # 頁碼
    indentation: int = 0  # 縮排層級

class TOCResponse(BaseModel):
    """目錄識別回應"""
    is_toc_page: bool = False  # 是否為目錄頁
    entries: List[TOCEntry] = []  # 目錄條目列表
    error: Optional[str] = None  # 錯誤訊息


def load_image_from_base64(base64_string: str) -> Image.Image:
    """從 Base64 字符串載入圖片"""
    try:
        # 移除 data URL 前綴
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        image_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")


def preprocess_ocr_text(text: str) -> str:
    """預處理 OCR 輸出的文本"""
    # Fix: Do NOT replace newlines with spaces. Replace multiple spaces with single space but keep newlines.
    # text = re.sub(r'\s+', ' ', text) # CAUSE OF FAILURE: Flattened everything
    
    # Normalize varied newlines
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # 修復常見錯誤
    text = text.replace('I', '壹').replace('II', '貳').replace('III', '參')
    
    # Clean up spaces around newlines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return '\n'.join(lines)


def parse_toc_from_text(text: str) -> tuple[bool, List[Dict]]:
    """從 OCR 文本中解析目錄結構"""
    entries = []
    lines = text.split('\n')
    
    # 中文數字對照表
    chinese_numbers = {
        '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5,
        '陸': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10,
        '屆': 3, # Common OCR error for 參
        '参': 3  # Simplified/Variant
    }
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        print(f"DEBUG: Processing line: '{line}'") # Enabled for debug
        print(f"DEBUG: Hex: {line.encode('utf-8').hex()}") # Check for hidden chars

        # 檢查是否為目錄條目
        # 主章節：壹、貳、參 或 一、二、三
        # Relaxed pattern: Allow . or space or , as separator
        main_pattern = r'([壹貳參肆伍陸柒捌玖拾一二三四五六七八九十])[、.,\s]\s*(.+?)(?:\.{2,}\s*(\d+))?'
        
        # 子章節：1.1、1.2 
        sub_pattern = r'(\d+\.\d+)[、.,\s]\s*(.+?)(?:\.{2,}\s*(\d+))?'
        
        match = re.match(main_pattern, line)
        if match:
            num_chinese = match.group(1)
            title = match.group(2).strip()
            page_num = match.group(3)
            # convert chinese num ...
            level = chinese_numbers.get(num_chinese, 1)
            entries.append({'level': level, 'title': title, 'page_number': int(page_num) if page_num else None, 'indentation': 0})
            print(f"DEBUG: Matched Main: {title}")
            continue
        
        match = re.match(sub_pattern, line)
        if match:
            num = match.group(1)
            title = match.group(2).strip()
            entries.append({'level': 2, 'title': f"{num} {title}", 'page_number': None, 'indentation': 2})
            print(f"DEBUG: Matched Sub: {title}")
            continue

    # Trust the upstream: If we are here, it IS a TOC page.
    # Just return whatever matches we found.
    is_toc = True
    
    return is_toc, entries


@app.get("/health")
async def health_check():
    """健康檢查"""
    return {"status": "ok", "service": "simple-toc-service", "device": DEVICE}


@app.post("/recognize-toc", response_model=TOCResponse)
async def recognize_toc(request: TOCRequest):
    """識別目錄頁面"""
    try:
        # 載入圖片
        image = None
        if request.image:
            image = load_image_from_base64(request.image)
        elif request.image_url:
            # 從 URL 載入
            import requests
            response = requests.get(request.image_url)
            image = Image.open(io.BytesIO(response.content))
        else:
            raise HTTPException(status_code=400, detail="Either image or image_url must be provided")
        
        # 轉為灰度以提高 OCR 準確度
        if image.mode != 'L':
            image = image.convert('L')
        
        # 調整圖片大小
        if max(image.size[0], image.size[1]) > MAX_IMAGE_SIZE[0]:
            ratio = MAX_IMAGE_SIZE[0] / max(image.size[0], image.size[1])
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # OCR 識別
        try:
            # 嘗試使用中文（繁體）
            ocr_text = pytesseract.image_to_string(
                image,
                lang='chi_tra+eng',
                config=TESSERACT_CONFIG
            )
        except:
            # 如果中文不可用，使用英文
            ocr_text = pytesseract.image_to_string(
                image,
                lang='eng',
                config=TESSERACT_CONFIG
            )
        
        print(f"OCR text length: {len(ocr_text)}")
        print(f"OCR text preview: {ocr_text[:300]}...")
        
        # 預處理
        ocr_text = preprocess_ocr_text(ocr_text)
        
        # 解析目錄結構
        is_toc, entries_raw = parse_toc_from_text(ocr_text)
        
        # 轉換為 Pydantic 模型
        entries = []
        for entry in entries_raw:
            entries.append(TOCEntry(
                level=entry['level'],
                title=entry['title'],
                page_number=entry['page_number'],
                indentation=entry['indentation']
            ))
        
        print(f"Extracted {len(entries)} TOC entries")
        
        return TOCResponse(
            is_toc_page=is_toc,
            entries=entries
        )
            
    except Exception as e:
        print(f"Error recognizing TOC: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@app.post("/recognize-toc-image", response_model=TOCResponse)
async def recognize_toc_from_image_file(image_file: UploadFile = File(...)):
    """直接上傳圖片檔案識別目錄"""
    try:
        # 讀取圖片
        image_bytes = await image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # 轉為灰度
        if image.mode != 'L':
            image = image.convert('L')
        
        # 調整大小
        if max(image.size[0], image.size[1]) > MAX_IMAGE_SIZE[0]:
            ratio = MAX_IMAGE_SIZE[0] / max(image.size[0], image.size[1])
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # OCR 識別
        try:
            ocr_text = pytesseract.image_to_string(
                image,
                lang='chi_tra+eng',
                config=TESSERACT_CONFIG
            )
        except:
            ocr_text = pytesseract.image_to_string(
                image,
                lang='eng',
                config=TESSERACT_CONFIG
            )
        
        print(f"OCR text length: {len(ocr_text)}")
        
        # 預處理
        ocr_text = preprocess_ocr_text(ocr_text)
        
        # 解析目錄結構
        is_toc, entries_raw = parse_toc_from_text(ocr_text)
        
        # 轉換為 Pydantic 模型
        entries = []
        for entry in entries_raw:
            entries.append(TOCEntry(
                level=entry['level'],
                title=entry['title'],
                page_number=entry['page_number'],
                indentation=entry['indentation']
            ))
        
        return TOCResponse(
            is_toc_page=is_toc,
            entries=entries
        )
            
    except Exception as e:
        print(f"Error recognizing TOC from image: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

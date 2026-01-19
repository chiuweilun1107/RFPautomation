#!/usr/bin/env python3
"""測試 PaddleOCR 服務"""

import base64
import json
import requests
from PIL import Image, ImageDraw, ImageFont
import io

# 創建一個簡單的測試圖片（包含中英文文字）
def create_test_image():
    """創建包含文字的測試圖片"""
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)

    # 使用系統默認字體
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 40)
    except:
        font = ImageFont.load_default()

    # 寫入中英文文字
    draw.text((50, 50), "測試文字 Test Text", fill='black', font=font)
    draw.text((50, 150), "Hello World 你好世界", fill='black', font=font)
    draw.text((50, 250), "PaddleOCR 識別測試", fill='black', font=font)

    # 轉換為 base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return f"data:image/png;base64,{img_base64}"

def test_paddleocr():
    """測試 PaddleOCR /detect 端點"""
    url = "http://localhost:8006/detect"

    print("🔧 創建測試圖片...")
    image_base64 = create_test_image()

    print("📤 發送 OCR 請求...")
    response = requests.post(url, json={"image": image_base64})

    if response.status_code != 200:
        print(f"❌ 請求失敗: {response.status_code}")
        print(response.text)
        return False

    result = response.json()

    print("\n✅ OCR 響應成功!")
    print(f"偵測到文字框數量: {result['total_boxes']}")

    if result['total_boxes'] > 0:
        print("\n偵測到的文字:")
        for i, (bbox, text, conf) in enumerate(zip(
            result['bboxes'],
            result['texts'],
            result['confidences']
        ), 1):
            print(f"  {i}. 文字: {text}")
            print(f"     位置: {bbox}")
            print(f"     信心度: {conf:.2%}")
    else:
        print("⚠️  未偵測到任何文字")

    return True

if __name__ == "__main__":
    print("=" * 60)
    print("PaddleOCR 服務測試")
    print("=" * 60)

    try:
        test_paddleocr()
    except Exception as e:
        print(f"❌ 測試失敗: {str(e)}")
        import traceback
        traceback.print_exc()

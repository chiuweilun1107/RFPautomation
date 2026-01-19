#!/usr/bin/env python3
"""測試修復後的 PaddleOCR 服務"""
import requests
import base64
from PIL import Image, ImageDraw, ImageFont
import io
import sys

def create_test_image(text, bg_color, text_color):
    """創建測試圖片"""
    img = Image.new('RGB', (200, 100), color=bg_color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except:
        font = ImageFont.load_default()

    draw.text((15, 15), text, fill=text_color, font=font)

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def test_ocr(name, image_b64):
    """測試 OCR API"""
    print(f"\n🧪 測試: {name}")
    print("="*50)

    url = "http://localhost:8006/detect"
    try:
        response = requests.post(url, json={"image": image_b64}, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 成功")
            print(f"   檢測到 {len(result['bboxes'])} 個文字框")
            for i, (bbox, text, conf) in enumerate(zip(
                result['bboxes'],
                result['texts'],
                result['confidences']
            )):
                print(f"   [{i}] '{text}' (信心度: {conf:.3f})")
                print(f"       Bbox: {bbox}")

            return len(result['bboxes'])
        else:
            print(f"❌ 失敗: {response.status_code}")
            print(f"   {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"❌ 連接失敗: 服務未啟動")
        print(f"   請先啟動 PaddleOCR 服務: python main.py")
        return None
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return None

def main():
    print("🔬 PaddleOCR 修復驗證測試")
    print("="*50)

    # 測試 1: 黑底白字 TEST (問題案例)
    img1 = create_test_image("TEST", "black", "white")
    count1 = test_ocr("黑底白字 TEST", img1)

    # 測試 2: 白底黑字 TEST (正常案例)
    img2 = create_test_image("TEST", "white", "black")
    count2 = test_ocr("白底黑字 TEST", img2)

    # 測試 3: 中文
    img3 = create_test_image("測試", "white", "black")
    count3 = test_ocr("白底黑字 測試", img3)

    # 評估結果
    print(f"\n📊 測試總結")
    print("="*50)

    if count1 is None or count2 is None or count3 is None:
        print("❌ 無法連接到服務，請確認服務已啟動")
        return 1

    if count1 == 1:
        print("✅ 黑底白字 TEST: 通過 (返回 1 個結果)")
    else:
        print(f"❌ 黑底白字 TEST: 失敗 (返回 {count1} 個結果，預期 1)")

    if count2 == 1:
        print("✅ 白底黑字 TEST: 通過")
    else:
        print(f"❌ 白底黑字 TEST: 失敗 (返回 {count2} 個結果)")

    if count3 == 1:
        print("✅ 中文測試: 通過")
    else:
        print(f"⚠️  中文測試: 返回 {count3} 個結果")

    if count1 == 1 and count2 == 1:
        print("\n🎉 所有測試通過！問題已修復。")
        return 0
    else:
        print("\n⚠️  部分測試失敗，需要進一步調查。")
        return 1

if __name__ == "__main__":
    sys.exit(main())

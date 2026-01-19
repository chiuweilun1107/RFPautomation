#!/usr/bin/env python3
"""
診斷 PaddleOCR 為何對 "TEST" 返回 15 個結果
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from paddleocr import PaddleOCR
import json

def create_test_image(text="TEST", bg_color="black", text_color="white"):
    """創建測試圖片"""
    img = Image.new('RGB', (200, 100), color=bg_color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except:
        font = ImageFont.load_default()

    draw.text((15, 15), text, fill=text_color, font=font)
    return np.array(img)

def diagnose_ocr(ocr, image, test_name):
    """診斷 OCR 結果結構"""
    print(f"\n{'='*60}")
    print(f"測試: {test_name}")
    print('='*60)

    # Use new predict API instead of deprecated ocr()
    result = ocr.predict(image)

    # 1. 檢查最外層結構
    print(f"\n1️⃣ 最外層結構:")
    print(f"   type(result): {type(result)}")
    print(f"   len(result): {len(result) if hasattr(result, '__len__') else 'N/A'}")

    # 2. 檢查 result[0]
    if result and len(result) > 0:
        print(f"\n2️⃣ result[0] 結構:")
        print(f"   type(result[0]): {type(result[0])}")

        # 如果是 OCRResult 對象
        if hasattr(result[0], '__dict__'):
            print(f"   OCRResult 屬性:")
            for key in dir(result[0]):
                if not key.startswith('_'):
                    try:
                        value = getattr(result[0], key)
                        if not callable(value):
                            print(f"     - {key}: {type(value)}")
                    except:
                        pass

        # 如果可迭代
        if hasattr(result[0], '__iter__'):
            try:
                items = list(result[0])
                print(f"\n3️⃣ result[0] 可迭代，共 {len(items)} 項:")
                for i, item in enumerate(items[:3]):
                    print(f"   [{i}] {type(item)}: {str(item)[:100]}")
            except Exception as e:
                print(f"   迭代失敗: {e}")

        # 3. 嘗試標準解析
        print(f"\n4️⃣ 嘗試標準解析:")
        try:
            if result[0] is None:
                print("   ⚠️ result[0] is None")
            else:
                for idx, line in enumerate(result[0]):
                    bbox = line[0]
                    text_info = line[1]
                    print(f"   [{idx}] Text: '{text_info[0]}', Conf: {text_info[1]:.3f}")
                    print(f"        Bbox: {bbox}")
        except Exception as e:
            print(f"   ❌ 標準解析失敗: {e}")

        # 4. 嘗試 OCRResult 屬性訪問
        print(f"\n5️⃣ 嘗試 OCRResult 屬性訪問:")
        try:
            if hasattr(result[0], 'rec_texts'):
                rec_texts = result[0].rec_texts
                rec_scores = result[0].rec_scores
                rec_polys = result[0].rec_polys

                print(f"   ✅ 找到 OCRResult 屬性:")
                print(f"      rec_texts: {rec_texts}")
                print(f"      rec_scores: {rec_scores}")
                print(f"      rec_polys: {rec_polys}")

                if rec_texts:
                    print(f"\n   檢測到 {len(rec_texts)} 個文字區域:")
                    for i, (text, score, poly) in enumerate(zip(rec_texts, rec_scores, rec_polys)):
                        print(f"   [{i}] Text: '{text}', Conf: {score:.3f}")
                        print(f"        Poly: {poly}")
            else:
                print("   ⚠️ 沒有 rec_texts 屬性")
        except Exception as e:
            print(f"   ❌ 屬性訪問失敗: {e}")

        # 5. 嘗試使用 json 方法獲取結果
        print(f"\n6️⃣ 嘗試使用 .json 屬性:")
        try:
            json_result = result[0].json
            print(f"   type(json): {type(json_result)}")
            print(f"   json keys: {json_result.keys() if isinstance(json_result, dict) else 'N/A'}")

            if isinstance(json_result, dict) and 'res' in json_result:
                res = json_result['res']
                print(f"\n   res keys: {res.keys() if isinstance(res, dict) else 'N/A'}")

                # 尋找 OCR 結果
                if isinstance(res, dict):
                    if 'dt_polys' in res:
                        dt_polys = res.get('dt_polys', [])
                        rec_texts = res.get('rec_texts', [])
                        rec_scores = res.get('rec_scores', [])

                        print(f"\n   ✅ 找到 OCR 結果!")
                        print(f"      檢測到 {len(rec_texts) if rec_texts else 0} 個文字區域")

                        if rec_texts:
                            for i, (text, score, poly) in enumerate(zip(rec_texts, rec_scores, dt_polys)):
                                print(f"\n   [{i}] Text: '{text}'")
                                print(f"       Confidence: {score:.3f}")
                                print(f"       Polygon: {poly[:2]}...")  # Show first 2 points
                    else:
                        print(f"\n   可用的 keys: {list(res.keys())}")

            # Pretty print full JSON for one test case
            if test_name == "黑底白字 TEST":
                import json as json_lib
                print(f"\n   完整 JSON 結構:")
                print(json_lib.dumps(json_result, indent=2, ensure_ascii=False)[:1000])
        except Exception as e:
            print(f"   ❌ JSON 訪問失敗: {e}")

def main():
    print("🔍 PaddleOCR 15 結果問題診斷")
    print("="*60)

    # 初始化 OCR
    print("\n初始化 PaddleOCR...")
    ocr = PaddleOCR(use_textline_orientation=True, lang='ch')

    # 測試 1: 黑底白字（問題案例）
    img1 = create_test_image("TEST", "black", "white")
    diagnose_ocr(ocr, img1, "黑底白字 TEST")

    # 測試 2: 白底黑字（正常案例）
    img2 = create_test_image("TEST", "white", "black")
    diagnose_ocr(ocr, img2, "白底黑字 TEST")

    # 測試 3: 中文測試
    img3 = create_test_image("測試", "white", "black")
    diagnose_ocr(ocr, img3, "白底黑字 測試")

    # 測試 4: 多行文字
    img4 = Image.new('RGB', (300, 150), color='white')
    draw = ImageDraw.Draw(img4)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    except:
        font = ImageFont.load_default()
    draw.text((10, 10), "Line 1", fill='black', font=font)
    draw.text((10, 60), "Line 2", fill='black', font=font)
    diagnose_ocr(ocr, np.array(img4), "雙行文字")

    print("\n" + "="*60)
    print("✅ 診斷完成")
    print("="*60)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
LLaVA-NeXT 服務測試腳本

測試 API 端點是否正常工作
"""

import base64
import json
import sys
from pathlib import Path
from PIL import Image
import requests

# API 端點
API_BASE_URL = "http://localhost:8001"

def test_health():
    """測試健康檢查"""
    print("=" * 60)
    print("測試 1: 健康檢查")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ 健康檢查成功")
        print(f"   狀態: {data.get('status')}")
        print(f"   模型: {data.get('model')}")
        print(f"   裝置: {data.get('device')}")
        print()
        return True
    except Exception as e:
        print(f"❌ 健康檢查失敗: {e}")
        print()
        return False


def test_toc_recognition_with_image(image_path: str):
    """使用圖片檔案測試目錄識別"""
    print("=" * 60)
    print(f"測試 2: 目錄識別（圖片檔案）")
    print(f"圖片: {image_path}")
    print("=" * 60)
    
    if not Path(image_path).exists():
        print(f"❌ 圖片不存在: {image_path}")
        return False
    
    try:
        # 讀取圖片並轉為 base64
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        print(f"   圖片大小: {len(image_data) // 1024} KB")
        
        # 調用 API
        print(f"   調用 API...")
        response = requests.post(
            f"{API_BASE_URL}/recognize-toc",
            json={"image": image_data},
            timeout=60
        )
        response.raise_for_status()
        
        data = response.json()
        
        # 顯示結果
        print(f"✅ 目錄識別成功")
        print(f"   是否為目錄頁: {data.get('is_toc_page')}")
        print(f"   目錄條目數量: {len(data.get('entries', []))}")
        
        if data.get('entries'):
            print(f"\n   目錄條目（前 5 個）:")
            for i, entry in enumerate(data['entries'][:5], 1):
                indent = "  " * entry.get('indentation', 0)
                print(f"   {indent}{i}. [層級 {entry.get('level')}] {entry.get('title')} (頁 {entry.get('page_number')})")
        
        error = data.get('error')
        if error:
            print(f"\n   ⚠️  錯誤訊息: {error}")
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ 目錄識別失敗: {e}")
        print()
        return False


def test_toc_recognition_with_upload(image_path: str):
    """使用文件上傳測試目錄識別"""
    print("=" * 60)
    print(f"測試 3: 目錄識別（文件上傳）")
    print(f"圖片: {image_path}")
    print("=" * 60)
    
    if not Path(image_path).exists():
        print(f"❌ 圖片不存在: {image_path}")
        return False
    
    try:
        # 上傳文件
        print(f"   上傳文件...")
        with open(image_path, 'rb') as f:
            files = {'image_file': (Path(image_path).name, f, 'image/png')}
            response = requests.post(
                f"{API_BASE_URL}/recognize-toc-image",
                files=files,
                timeout=60
            )
        response.raise_for_status()
        
        data = response.json()
        
        # 顯示結果
        print(f"✅ 目錄識別成功")
        print(f"   是否為目錄頁: {data.get('is_toc_page')}")
        print(f"   目錄條目數量: {len(data.get('entries', []))}")
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ 目錄識別失敗: {e}")
        print()
        return False


def main():
    """主測試函數"""
    print("\n" + "=" * 60)
    print("LLaVA-NeXT 服務測試")
    print("=" * 60)
    print()
    
    # 檢查服務是否運行
    if not test_health():
        print("❌ 服務未運行，請先啟動服務:")
        print("   cd llava-next-service")
        print("   ./start.sh")
        sys.exit(1)
    
    # 測試圖片路徑（您可以修改這裡）
    test_image = "toc-test-image.png"
    
    # 如果測試圖片不存在，創建一個示例圖片
    if not Path(test_image).exists():
        print("⚠️  測試圖片不存在，創建示例圖片...")
        create_sample_image(test_image)
    
    # 執行測試
    results = []
    
    # 測試 1: 健康檢查
    results.append(("健康檢查", test_health()))
    
    # 測試 2: 圖片檔案識別
    if Path(test_image).exists():
        results.append(("圖片檔案識別", test_toc_recognition_with_image(test_image)))
        results.append(("文件上傳識別", test_toc_recognition_with_upload(test_image)))
    else:
        print("⚠️  跳過目錄識別測試（測試圖片不存在）")
        print()
        print("   您可以使用自己的目錄頁圖片進行測試:")
        print("   python test_service.py <path/to/toc-page.png>")
        print()
    
    # 總結
    print("=" * 60)
    print("測試總結")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ 通過" if passed else "❌ 失敗"
        print(f"   {status} - {test_name}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    print(f"\n   通過率: {passed_count}/{total_count} ({passed_count/total_count*100:.1f}%)")
    print()
    
    if passed_count == total_count:
        print("🎉 所有測試通過！服務運行正常。")
        print()
        print("您現在可以:")
        print("   1. 在 n8n 中創建 HTTP Request 節點調用此服務")
        print("   2. 使用 API 識別 PDF 目錄頁")
        print("   3. 查看 API 文檔: http://localhost:8001/docs")
        print()


def create_sample_image(path: str):
    """創建示例測試圖片"""
    from PIL import Image, ImageDraw, ImageFont
    
    # 創建白色背景
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # 嘗試使用預設字體
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)
    except:
        font = ImageFont.load_default()
    
    # 繪製示例目錄
    y = 50
    texts = [
        "目 錄",
        "",
        "壹、計畫概述 ................................ 5",
        "1.1 專案背景 ............................ 6",
        "1.2 計畫目標 ............................ 7",
        "",
        "貳、工作內容 ................................ 8",
        "2.1 需求分析 ............................ 9",
        "2.2 系統設計 ............................ 10",
        "",
        "參、交付成果 ................................ 11",
    ]
    
    for text in texts:
        draw.text((50, y), text, fill='black', font=font)
        y += 40
    
    # 保存圖片
    img.save(path, 'PNG')
    print(f"   示例圖片已創建: {path}")
    print()


if __name__ == "__main__":
    # 檢查命令行參數
    if len(sys.argv) > 1:
        test_image = sys.argv[1]
        print(f"使用指定測試圖片: {test_image}")
        print()
        
        # 只測試指定圖片
        if test_health():
            test_toc_recognition_with_image(test_image)
    else:
        # 執行完整測試
        main()

#!/usr/bin/env python3
"""診斷遮罩問題"""
import requests
import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
    except:
        font = ImageFont.load_default()
    
    draw.text((50, 50), "REMOVE TEXT", fill='black', font=font)
    return img

def image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

print("🔍 診斷遮罩問題\n")

# 1. 創建測試圖片
img = create_test_image()
img_b64 = image_to_base64(img)
img.save("/tmp/diag_original.png")
print(f"✅ 原圖: /tmp/diag_original.png")

# 2. PaddleOCR 檢測
print("\n📍 PaddleOCR 檢測...")
detect_resp = requests.post(
    "http://localhost:8006/detect",
    json={"image": img_b64}
)
result = detect_resp.json()
bboxes = result['bboxes']
texts = result['texts']

print(f"檢測到 {len(bboxes)} 個區域:")
for i, (bbox, text) in enumerate(zip(bboxes, texts)):
    print(f"  [{i}] '{text}' at {bbox}")

# 3. 創建遮罩
print("\n📍 創建遮罩...")
mask_resp = requests.post(
    "http://localhost:8005/mask",
    json={"image": img_b64, "bboxes": bboxes, "scale": "pixel"}
)
mask_b64 = mask_resp.json()['mask']
if ',' in mask_b64:
    mask_b64 = mask_b64.split(',')[1]

# 保存遮罩查看
mask_data = base64.b64decode(mask_b64)
mask_img = Image.open(io.BytesIO(mask_data))
mask_img.save("/tmp/diag_mask.png")
print(f"✅ 遮罩: /tmp/diag_mask.png")
print(f"   尺寸: {mask_img.size}")
print(f"   模式: {mask_img.mode}")

# 4. 手動創建正確的遮罩對比
print("\n📍 創建手動遮罩對比...")
manual_mask = Image.new('L', img.size, 0)  # 黑色背景
draw = ImageDraw.Draw(manual_mask)

# 根據 bbox 畫白色區域
for bbox in bboxes:
    ymin, xmin, ymax, xmax = bbox
    draw.rectangle([xmin, ymin, xmax, ymax], fill=255)

manual_mask.save("/tmp/diag_manual_mask.png")
print(f"✅ 手動遮罩: /tmp/diag_manual_mask.png")

# 5. 使用手動遮罩測試 IOPaint
print("\n📍 使用手動遮罩測試 IOPaint...")
manual_mask_b64 = image_to_base64(manual_mask)

inpaint_resp = requests.post(
    "http://localhost:8080/api/v1/inpaint",
    json={
        "image": img_b64,
        "mask": manual_mask_b64,
        "hd_strategy": "Original"
    },
    timeout=60
)

if inpaint_resp.status_code == 200:
    result_img = Image.open(io.BytesIO(inpaint_resp.content))
    result_img.save("/tmp/diag_manual_result.png")
    print(f"✅ 結果: /tmp/diag_manual_result.png")
else:
    print(f"❌ 失敗: {inpaint_resp.text}")

print("\n💡 請檢查以下文件:")
print("   /tmp/diag_original.png     - 原圖")
print("   /tmp/diag_mask.png         - API 生成的遮罩")
print("   /tmp/diag_manual_mask.png  - 手動遮罩")
print("   /tmp/diag_manual_result.png - 使用手動遮罩的結果")

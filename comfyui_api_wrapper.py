#!/usr/bin/env python3
"""
ComfyUI API 包裝器
提供與 IOPaint 相容的 REST API
"""
import requests
import base64
import json
import uuid
from PIL import Image
import io
from flask import Flask, request, jsonify, send_file
import time

app = Flask(__name__)

COMFYUI_URL = "http://localhost:8081"

@app.route('/api/v1/inpaint', methods=['POST'])
def inpaint():
    """
    接收 IOPaint 格式的請求，轉換為 ComfyUI 格式
    """
    try:
        print("📥 收到 inpaint 請求")
        data = request.json
        print(f"📝 請求參數: {list(data.keys())}")

        # 解析 base64 圖片
        image_b64 = data['image']
        mask_b64 = data['mask']

        # 移除 data URI 前綴（如果有）
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]
        if ',' in mask_b64:
            mask_b64 = mask_b64.split(',')[1]

        # 將圖片轉換為 PIL Image
        image_data = base64.b64decode(image_b64)
        mask_data = base64.b64decode(mask_b64)

        image = Image.open(io.BytesIO(image_data))
        mask = Image.open(io.BytesIO(mask_data))

        # 保存到臨時文件供 ComfyUI 使用
        temp_id = str(uuid.uuid4())
        image_path = f"/tmp/comfyui_input_{temp_id}.png"
        mask_path = f"/tmp/comfyui_mask_{temp_id}.png"

        image.save(image_path)
        mask.save(mask_path)

        # 準備 ComfyUI workflow - 使用 DiffusersLoader
        workflow = {
            "3": {
                "inputs": {
                    "seed": 42,
                    "steps": data.get('num_inference_steps', 20),
                    "cfg": data.get('guidance_scale', 7.5),
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "model_path": "sd-v1-5-inpainting"
                },
                "class_type": "DiffusersLoader"
            },
            "5": {
                "inputs": {
                    "pixels": ["9", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEEncode"
            },
            "6": {
                "inputs": {
                    "text": data.get('prompt', 'clean white surface, smooth, no text'),
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": data.get('negative_prompt', 'text, letters, words, writing'),
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "image": image_path,
                    "upload": "image"
                },
                "class_type": "LoadImage"
            },
            "17": {
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        }

        # 調用 ComfyUI API
        prompt_request = {"prompt": workflow}
        print(f"📤 發送請求到 ComfyUI...")

        response = requests.post(
            f"{COMFYUI_URL}/prompt",
            json=prompt_request
        )
        print(f"📨 ComfyUI 響應: {response.status_code}")

        if response.status_code == 200:
            # 獲取 prompt_id
            result = response.json()
            prompt_id = result['prompt_id']
            print(f"🎫 Prompt ID: {prompt_id}")

            # 輪詢結果
            print(f"⏳ 等待處理完成...")
            output_image = wait_for_result(prompt_id, timeout=120)

            if output_image:
                print(f"✅ 處理完成，返回圖片")
                return send_file(
                    io.BytesIO(output_image),
                    mimetype='image/png'
                )
            else:
                print(f"❌ 處理超時")
                return jsonify({"error": "ComfyUI processing timeout"}), 500
        else:
            print(f"❌ ComfyUI 錯誤: {response.text[:200]}")
            return jsonify({"error": f"ComfyUI failed: {response.text}"}), 500

    except Exception as e:
        print(f"❌ 異常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def wait_for_result(prompt_id, timeout=120):
    """等待 ComfyUI 完成處理"""
    start = time.time()

    while time.time() - start < timeout:
        try:
            # 檢查歷史記錄
            history_resp = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")

            if history_resp.status_code == 200:
                history = history_resp.json()

                if prompt_id in history:
                    outputs = history[prompt_id].get('outputs', {})

                    # 查找保存的圖片
                    for node_id, node_output in outputs.items():
                        if 'images' in node_output:
                            images = node_output['images']
                            if images:
                                # 獲取第一張圖片
                                image_info = images[0]
                                filename = image_info['filename']
                                subfolder = image_info.get('subfolder', '')
                                folder_type = image_info.get('type', 'output')

                                # 下載圖片
                                params = {
                                    'filename': filename,
                                    'subfolder': subfolder,
                                    'type': folder_type
                                }

                                image_resp = requests.get(
                                    f"{COMFYUI_URL}/view",
                                    params=params
                                )

                                if image_resp.status_code == 200:
                                    return image_resp.content

        except Exception as e:
            print(f"Error checking status: {e}")

        time.sleep(1)

    return None

@app.route('/health', methods=['GET'])
def health():
    """健康檢查"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("🚀 ComfyUI API 包裝器啟動中...")
    print("📍 端口: 8082")
    print("📍 與 IOPaint API 相容")
    app.run(host='0.0.0.0', port=8082, debug=False)

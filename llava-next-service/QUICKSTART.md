# LLaVA-NeXT 服務 - 快速開始指南

本指南將幫您在 5 分鐘內啟動 LLaVA-NeXT 服務。

## 前置要求

- ✅ Docker 和 Docker Compose 已安裝
- ✅ 至少 8GB RAM（建議 16GB）
- ✅ 至少 50GB 磁碟空間
- ✅ 可選：NVIDIA GPU（加速推理）

## 1. 克隆或進入服務目錄

```bash
cd /path/to/llava-next-service
```

## 2. 檢查 Docker 環境

```bash
# 檢查 Docker 版本
docker --version

# 檢查 Docker Compose 版本
docker-compose --version
```

## 3. 建構並啟動服務

```bash
# 方式 1：使用 docker-compose（推薦）
docker-compose up -d --build

# 方式 2：使用 start.sh 腳本
chmod +x start.sh
./start.sh
```

## 4. 檢查服務狀態

```bash
# 檢查容器是否運行中
docker ps | grep llava-next-service

# 查看日誌
docker logs -f llava-next-service
```

**預期日誌輸出：**
```
Loading model: llava-hf/llava-v1.6-34b-hf
Device: cuda
Loading LLaVA-NeXT model...
Model loaded successfully!
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**⚠️ 注意：**首次啟動可能需要 10-30 分鐘下載模型（~70GB），請耐心等待。

## 5. 測試服務

### 測試健康檢查

```bash
curl http://localhost:8001/health
```

**預期回應：**
```json
{
  "status": "ok",
  "model": "llava-hf/llava-v1.6-34b-hf",
  "device": "cuda"
}
```

### 測試目錄識別（使用測試腳本）

```bash
# 創建測試腳本
cat > test_llava.py << 'EOF'
import base64
import json
import requests
from pathlib import Path

# 測試圖片路徑（替換為您的目錄頁圖片）
IMAGE_PATH = "path/to/toc-page.png"

# 讀取圖片並轉為 base64
with open(IMAGE_PATH, 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# 調用 API
response = requests.post(
    "http://localhost:8001/recognize-toc",
    json={"image": image_data}
)

print("Status:", response.status_code)
print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
EOF

# 運行測試
python test_llava.py
```

### 測試使用 curl

```bash
# 假設您有一個 base64 編碼的圖片
curl -X POST http://localhost:8001/recognize-toc \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image_string"
  }'
```

## 6. 整合到 n8n 工作流

在 n8n 中創建 **HTTP Request** 節點：

```json
{
  "method": "POST",
  "url": "http://llava-next-service:8001/recognize-toc",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "image": "{{$json.base64Image}}"
  }
}
```

**n8n 工作流流程：**
1. Webhook 節點：接收 PDF 檔案
2. HTTP Request：調用 Docling 生成目錄頁圖像
3. Code 節點：將圖片轉為 base64
4. HTTP Request：調用 LLaVA-NeXT Service 識別目錄
5. Code 節點：合併目錄 + Docling Markdown
6. HTTP Request：上傳到 Supabase

## 7. 停止服務

```bash
# 停止並移除容器
docker-compose down

# 停止並移除容器和 volume
docker-compose down -v
```

## 8. 更新服務

```bash
# 重新建構並啟動
docker-compose up -d --build --force-recreate
```

## 常見問題

### Q1: 模型下載太慢怎麼辦？

**A:** 首次下載模型可能需要很長時間（10-30 分鐘）。
- 檢查網速
- 考慮使用代理或 VPN
- 耐心等待，日誌會顯示下載進度

### Q2: 服務啟動失敗

**A:** 檢查日誌：
```bash
docker logs llava-next-service
```

常見原因：
- **記憶體不足**：減少 Docker memory 限制
- **磁碟空間不足**：釋放空間
- **端口被佔用**：修改 docker-compose.yml 中的端口映射

### Q3: 識別結果不準確

**A:** 嘗試以下方法：
1. 提高圖片清晰度
2. 調整圖片大小（不要超過 1024x1024）
3. 使用更高分辨率版本的模型（LLaVA-NeXT-72B）

### Q4: 如何使用 GPU 加速？

**A:** 修改 docker-compose.yml：

```yaml
services:
  llava-next:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

並確保已安裝 NVIDIA Container Toolkit。

### Q5: 如何查看服務性能？

**A:** 使用 Docker stats：
```bash
docker stats llava-next-service
```

## 下一步

- 📖 閱讀 [README.md](README.md) 了解詳細功能
- 🔧 修改 [service.py](service.py) 自訂 Prompt
- 🚀 整合到 n8n 工作流

## 技術支持

如有問題，請查看日誌：
```bash
docker logs -f llava-next-service
```

或聯繫開發團隊。

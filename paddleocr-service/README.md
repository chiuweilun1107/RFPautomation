# PaddleOCR 服務

基於 PaddleOCR 的文字偵測服務，用於 WF16 文字移除工作流。

## 功能

- 偵測圖片中的中英文文字
- 返回文字區域的邊界框（bboxes）
- 支援 Base64 圖片輸入

## API 端點

### GET /health
健康檢查

### POST /detect
偵測文字區域

**請求：**
```json
{
  "image": "base64_encoded_image_string"
}
```

**響應：**
```json
{
  "success": true,
  "bboxes": [[ymin, xmin, ymax, xmax], ...],
  "texts": ["文字1", "文字2", ...],
  "confidences": [0.98, 0.95, ...],
  "total_boxes": 2
}
```

## 本地開發

```bash
pip install -r requirements.txt
python main.py
```

## Docker 部署

```bash
docker build -t paddleocr-service .
docker run -p 8006:8000 paddleocr-service
```

## 整合到 docker-compose

已整合到專案的 `docker-compose.yml` 中。

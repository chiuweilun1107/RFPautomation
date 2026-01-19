# 簡易 PDF 目錄識別服務

使用 Tesseract OCR 和規則匹配的 PDF 目錄識別服務。

## 特性

- ✅ 支援中文和英文目錄識別
- ✅ 輕量級部署（不依賴大型 ML 模型）
- ✅ 支援多種目錄格式（數字編號、中文數字、縮排）
- ✅ Docker 容器化部署
- ✅ FastAPI REST API

## 架構

### 技術棧

- **OCR 引擎**: Tesseract OCR（支援繁體中文）
- **Web 框架**: FastAPI + Uvicorn
- **圖片處理**: Pillow (PIL)
- **容器**: Docker

### 識別規則

服務使用規則匹配來識別目錄結構：

1. **主章節**: 中文數字（壹、貳、參...）或數字（一、二、三...）
2. **子章節**: 數字編號（1.1、1.2、2.1...）
3. **次級章節**: 括號編號（(1)、(2)、(3)...）

### 目錄判斷

- 至少檢測到 2 個主章節條目
- 包含頁碼信息（可選）

## 安裝與部署

### 前置需求

- Docker 和 Docker Compose
- 至少 1GB 可用磁碟空間

### 快速啟動

```bash
cd llava-next-service
docker-compose up -d
```

服務將在 `http://localhost:8001` 上運行。

### 停止服務

```bash
docker-compose down
```

## API 使用說明

### 1. 健康檢查

```bash
curl http://localhost:8001/health
```

回應：
```json
{
  "status": "ok",
  "service": "simple-toc-service",
  "device": "cpu"
}
```

### 2. 識別目錄（Base64 圖片）

```bash
curl -X POST http://localhost:8001/recognize-toc \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }'
```

回應：
```json
{
  "is_toc_page": true,
  "entries": [
    {
      "level": 1,
      "title": "專案背景",
      "page_number": 1,
      "indentation": 0
    },
    {
      "level": 1,
      "title": "技術方案",
      "page_number": 2,
      "indentation": 0
    },
    {
      "level": 2,
      "title": "1.1 系統架構",
      "page_number": 3,
      "indentation": 2
    }
  ]
}
```

### 3. 識別目錄（上傳圖片檔案）

```bash
curl -X POST http://localhost:8001/recognize-toc-image \
  -F "image=@/path/to/toc_page.png"
```

### 4. 識別目錄（圖片 URL）

```bash
curl -X POST http://localhost:8001/recognize-toc \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/toc_page.png"
  }'
```

## 配置選項

### Docker Compose 配置

修改 `docker-compose.yml` 中的配置：

```yaml
services:
  llava-next-service:
    ports:
      - "8001:8000"  # 修改對外埠口
    volumes:
      - ./output:/app/output  # 輸出目錄掛載
```

### 服務配置

可在 `docker-compose.yml` 中添加環境變量：

```yaml
environment:
  - MAX_IMAGE_SIZE=2048  # 最大圖片尺寸
  - TESSERACT_CONFIG='--oem 3 --psm 6'  # OCR 配置
```

## 與 MinerU 整合

服務可與 MinerU 整合使用，實現完整的 PDF 處理流程：

1. **MinerU** 提取 PDF 頁面圖片
2. **Simple TOC Service** 識別目錄頁面
3. **MinerU** 根據目錄結構進行內容提取

詳細整合說明請參閱 [INTEGRATION.md](INTEGRATION.md)

## 測試

### 使用測試腳本

```bash
python test_service.py
```

### 手動測試

```bash
# 測試健康端點
curl http://localhost:8001/health

# 測試識別端點
curl -X POST http://localhost:8001/recognize-toc-image \
  -F "image=@test_toc.png"
```

## 故障排除

### 容器無法啟動

```bash
# 檢查日誌
docker logs llava-next-service

# 檢查埠口是否被占用
lsof -i :8001
```

### 識別準確度低

- 確保圖片清晰度足夠
- 嘗試調整圖片大小
- 檢查目錄格式是否支援

### Tesseract 語言包問題

```bash
# 重新建構映像並安裝完整語言包
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 效能優化

- **圖片大小**: 建議輸入圖片不大於 2048x2048
- **批量處理**: 服務為同步處理，大量請求請使用佇列
- **快取**: 可考慮添加 Redis 快取常見目錄模式

## 開發與擴展

### 添加新的目錄規則

編輯 `service.py` 中的 `parse_toc_from_text` 函數：

```python
# 添加新的匹配模式
custom_pattern = r'你的模式' \
    r'\s*(.+?)(?:\.{3,}\s*(\d+))?'

match = re.match(custom_pattern, line)
if match:
    # 處理匹配結果
    pass
```

### 改善 OCR 準確度

1. 優化圖片預處理（對比度、二值化等）
2. 訓練自定義 Tesseract 模型
3. 使用其他 OCR 引擎（如 PaddleOCR）

## 授權

本服務使用 MIT 授權。

## 相關專案

- [MinerU](https://github.com/opendatalab/MinerU) - PDF 解析引擎
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - OCR 引擎
- [FastAPI](https://fastapi.tiangolo.com/) - Web 框架

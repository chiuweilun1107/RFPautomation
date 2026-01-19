# MinerU Docker 服務

## 概述

這是一個將 MinerU PDF 解析服務容器化的 Docker 配置，適用於在 macOS (ARM64) 上運行，使用本地已下載的模型進行 CPU 模式解析。

## 目錄結構

```
mineru_docker/
├── Dockerfile              # Docker 鏡像定義
├── docker-compose.yml      # Docker Compose 配置
├── service.py              # FastAPI 服務主程序
├── mineru-cpu.json         # MinerU 配置文件
├── test_service.py         # 測試腳本
├── .dockerignore          # Docker 構建忽略文件
├── output/                # 輸出目錄（映射到容器）
└── README.md              # 本文件
```

## 前置要求

### 必需

1. **Docker Desktop for Mac** (ARM64 版本)
   - 下載: https://www.docker.com/products/docker-desktop/
   
2. **本地已安裝 MinerU 並下載模型**
   - 模型路徑: `~/.cache/modelscope/hub/models/OpenDataLab/`
   - 應包含以下模型目錄:
     - `MinerU2___5-2509-1___2B`
     - `PDF-Extract-Kit-1___0`

3. **系統資源**
   - 至少 4 GB 可用記憶體
   - 至少 2 CPU 核心（建議 4 核心以獲得更好性能）

### 可選

- Python 3.10+ (用於運行測試腳本)
- requests 套件 (`pip install requests`)

## 快速開始

### 1. 驗證模型存在

確保模型已下載到正確位置：

```bash
ls -la ~/.cache/modelscope/hub/models/OpenDataLab/
```

應該看到：
- `MinerU2___5-2509-1___2B/`
- `PDF-Extract-Kit-1___0/`

### 2. 構建並啟動服務

```bash
cd mineru_docker
docker-compose up -d --build
```

這會：
- 構建 Docker 鏡像
- 啟動容器
- 在 `http://localhost:8001` 暴露服務

### 3. 驗證服務運行

```bash
# 檢查容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 測試健康檢查
curl http://localhost:8001/health
```

### 4. 測試解析功能

選項 A: 使用測試腳本（需要 Python）

```bash
# 安裝依賴
pip install requests

# 運行測試（不含 PDF）
python test_service.py

# 運行測試並解析 PDF
python test_service.py /path/to/your/document.pdf
```

選項 B: 使用 cURL

```bash
# 解析 PDF
curl -X POST "http://localhost:8001/parse" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

選項 C: 使用瀏覽器 API 文檔

訪問: http://localhost:8001/docs

## API 端點

### `GET /`

返回服務基本信息。

**響應:**
```json
{
  "service": "MinerU Docker Service",
  "version": "1.0.0",
  "mode": "CPU",
  "endpoints": {
    "health": "/health",
    "parse": "/parse (POST)",
    "docs": "/docs"
  }
}
```

### `GET /health`

健康檢查端點，用於監控服務狀態。

**響應:**
```json
{
  "status": "healthy",
  "service": "mineru-docker-cpu",
  "version": "1.0.0"
}
```

### `POST /parse`

解析 PDF 文件。

**請求:**
- Content-Type: `multipart/form-data`
- 參數: `file` (PDF 文件)

**響應:**
```json
{
  "filename": "document.pdf",
  "saved_to": "/app/output/document.md",
  "content": "# 標題\n內容預覽...",
  "status": "success",
  "engine": "mineru-docker-cpu"
}
```

**錯誤響應:**
```json
{
  "detail": "Only PDF files are supported."
}
```

### `GET /docs`

Swagger UI API 文檔界面。

## 配置說明

### `docker-compose.yml`

主要配置：

```yaml
volumes:
  # 配置文件（只讀）
  - ./mineru-cpu.json:/app/mineru.json:ro
  # 模型目錄（只讀）
  - /Users/chiuyongren/.cache/modelscope/hub/models/OpenDataLab:/models:ro
  # 輸出目錄（讀寫）
  - ./output:/app/output
  # 緩存卷
  - mineru-cache:/tmp/mineru_cache

deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

### `mineru-cpu.json`

MinerU 配置文件，主要設置：

- `device-mode`: "cpu" - CPU 模式
- `models-dir`: 本地模型路徑
- `llm-aided-config`: LLM 輔助配置（可選）

## 使用範例

### Python 範例

```python
import requests

# 解析 PDF
with open('document.pdf', 'rb') as f:
    files = {'file': ('document.pdf', f, 'application/pdf')}
    response = requests.post(
        'http://localhost:8001/parse',
        files=files,
        timeout=300
    )

result = response.json()
print(result['saved_to'])  # 輸出文件路徑
```

### cURL 範例

```bash
curl -X POST "http://localhost:8001/parse" \
  -F "file=@document.pdf" \
  -o result.json

# 查看結果
cat result.json
```

### JavaScript (Node.js) 範例

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('document.pdf'));

axios.post('http://localhost:8001/parse', form, {
  headers: form.getHeaders(),
  timeout: 300000
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error);
});
```

## 輸出文件

解析後的 Markdown 文件會保存在 `./output/` 目錄下：

```
output/
└── document.md
```

文件包含：
- 結構化文本內容
- HTML 表格
- 圖片引用

## 性能優化

### CPU 調整

根據您的系統調整 CPU 限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '6'  # 增加到 6 核心
```

### 記憶體調整

對於大型 PDF 文件：

```yaml
deploy:
  resources:
    limits:
      memory: 16G  # 增加到 16GB
```

### 批次處理

創建批次處理腳本：

```bash
#!/bin/bash
# batch_process.sh

for pdf in *.pdf; do
    echo "Processing $pdf..."
    curl -X POST "http://localhost:8001/parse" \
      -F "file=@$pdf" \
      -o "output/${pdf%.pdf}.json"
    echo "Completed $pdf"
done
```

## 疑難排解

### 問題 1: 容器無法啟動

**症狀:**
```bash
docker-compose up
# Error: ...
```

**解決方案:**
1. 檢查 Docker Desktop 是否運行
2. 檢查模型路徑是否正確
3. 查看詳細日誌: `docker-compose logs`

### 問題 2: 模型找不到

**症狀:**
```json
{"detail": "Model not found"}
```

**解決方案:**
1. 確認模型已下載到 `~/.cache/modelscope/hub/models/OpenDataLab/`
2. 檢查 `mineru-cpu.json` 中的模型路徑是否正確
3. 驗證卷掛載: `docker-compose config`

### 問題 3: 解析失敗

**症狀:**
```json
{"detail": "MinerU parsing failed", "error": "..."}
```

**解決方案:**
1. 檢查 PDF 文件是否損壞
2. 查看容器日誌: `docker-compose logs -f`
3. 確認有足夠的系統資源
4. 嘗試處理較小的 PDF 文件

### 問題 4: 連接拒絕

**症狀:**
```
Connection refused
```

**解決方案:**
1. 確認容器正在運行: `docker-compose ps`
2. 檢查端口是否被佔用: `lsof -i :8001`
3. 重啟服務: `docker-compose restart`

### 問題 5: 記憶體不足

**症狀:**
```
Killed
```

**解決方案:**
1. 增加記憶體限制
2. 減少並行處理
3. 使用分頁處理大型 PDF

## 日誌和監控

### 查看即時日誌

```bash
docker-compose logs -f
```

### 查看容器統計

```bash
docker stats mineru-service
```

### 健康檢查

```bash
# 端點
curl http://localhost:8001/health

# Docker Compose
docker-compose ps
```

## 維護

### 更新鏡像

```bash
docker-compose pull
docker-compose up -d --build
```

### 清理舊容器

```bash
docker-compose down -v
docker system prune -a
```

### 備份輸出

```bash
# 備份 output 目錄
tar -czf output_backup_$(date +%Y%m%d).tar.gz output/

# 恢復
tar -xzf output_backup_20231226.tar.gz
```

## 停止服務

```bash
# 停止並移除容器
docker-compose down

# 停止並移除容器和卷
docker-compose down -v
```

## 進階配置

### 自動重啟

`docker-compose.yml` 中已配置：
```yaml
restart: unless-stopped
```

### 日誌輪轉

已配置，最多保留 3 個日誌文件，每個最大 10MB：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 網絡配置

使用自定義網絡：
```yaml
networks:
  mineru-network:
    driver: bridge
```

## 整合到其他服務

### N8n Workflow

使用 HTTP Request 節點：

1. Method: `POST`
2. URL: `http://host.docker.internal:8001/parse`
3. Body Type: `Multipart/form-data`
4. Field: `file` (Binary)

### Next.js API Route

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const response = await fetch('http://localhost:8001/parse', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}
```

## 常見問題 (FAQ)

**Q: 為什麼使用 CPU 模式而不是 GPU？**

A: macOS 的 MPS 有相容性問題，CPU 模式更穩定。如需 GPU 性能，建議在 Linux 上運行。

**Q: 可以並行處理多個 PDF 嗎？**

A: 可以，但建議限制並行數量以避免資源耗盡。可以啟動多個容器實例。

**Q: 如何提高處理速度？**

A: 
1. 增加 CPU 和記憶體限制
2. 使用 SSD 存儲
3. 預熱模型（首次運行會較慢）
4. 考慮使用 Linux + GPU 環境

**Q: 輸出文件在哪裡？**

A: 在宿主機的 `./output/` 目錄下，會自動同步。

**Q: 支持哪些 PDF 格式？**

A: 支持標準 PDF 格式，包括:
- 文本 PDF
- 掃描 PDF (OCR)
- 混合格式
- 包含表格和圖片的 PDF

## 參考資源

- [MinerU 官方文檔](https://github.com/opendatalab/MinerU)
- [Docker 文檔](https://docs.docker.com/)
- [FastAPI 文檔](https://fastapi.tiangolo.com/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)

## 技術支持

如有問題，請：
1. 查看本文件的「疑難排解」部分
2. 檢查容器日誌: `docker-compose logs -f`
3. 參考 [MinerU 官方文檔](https://github.com/opendatalab/MinerU)

## 許可證

本配置遵循原 MinerU 專案的許可證。

## 更新日誌

### 2025-12-26
- ✅ 完整的 Docker 容器化配置
- ✅ 支持本地模型掛載
- ✅ FastAPI 服務封裝
- ✅ 健康檢查和監控
- ✅ 測試腳本
- ✅ 資源限制和優化
- ✅ 完整的使用文檔

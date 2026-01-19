# 環境變量配置指南

## 概述

本項目已完全遷移至使用環境變量來配置 n8n webhook URLs，替代硬編碼的 IP 地址和端口。

### 修復內容

✅ **所有 3 個原始問題已解決**：
1. **硬編碼 webhook URLs** → 改用 `process.env` 讀取
2. **環境變量名不統一** → 標準化為統一命名方案  
3. **Docker 環境變量傳入失敗** → Dockerfile 已更新支持運行時環境變量

---

## 環境變量列表

| 環境變量 | 說明 | 本地開發 | 生產環境 |
|---------|------|--------|--------|
| `N8N_WEBHOOK_URL` | 主要 webhook 端點 | `http://localhost:5679/webhook/parse-tender` | `http://5.78.118.41:5679/webhook/parse-tender` |
| `N8N_INGEST_WEBHOOK` | 文檔攝取 | `http://localhost:5679/webhook/ingest` | `http://n8n-server/webhook/ingest` |
| `N8N_TEMPLATE_PARSE_WEBHOOK` | 模板解析 | `http://localhost:5679/webhook/parse-template-v2` | `http://n8n-server/webhook/parse-template-v2` |
| `N8N_DOCUMENT_GENERATE_WEBHOOK` | 文檔生成 | `http://localhost:5679/webhook/generate-document-v2` | `http://n8n-server/webhook/generate-document-v2` |
| `N8N_WEBHOOK_TEXT_REMOVAL` | 文字移除 | `http://localhost:5679/webhook/remove-text` | `http://n8n-server/webhook/remove-text` |
| `N8N_IMAGE_GENERATION_WEBHOOK` | 圖片生成 | `http://localhost:5679/webhook/generate-image` | `http://n8n-server/webhook/generate-image` |
| `N8N_INTEGRATE_CHAPTER_WEBHOOK` | 章節集成 | `http://localhost:5679/webhook/integrate-chapter` | `http://n8n-server/webhook/integrate-chapter` |
| `N8N_BASE_URL` | n8n 基礎 URL | `http://localhost:5679` | `http://n8n-server:5679` |

### 重要提醒

- **本地開發**：使用 `localhost:5679`（Docker 容器映射的主機端口）
- **Docker 容器內部通信**：使用 `http://rfp-n8n:5678`（容器內部端口）
- **生產環境**：替換為實際的 n8n 伺服器地址

---

## 本地開發設置

### 1. 確認 `.env.local` 配置

```bash
cd frontend

# 檢查是否有 .env.local 文件
ls -la .env.local

# 如果沒有，從 .env.local.example 複製
cp .env.local.example .env.local
```

### 2. 啟動 n8n 容器

```bash
# n8n 容器應該在端口 5679 運行
docker ps | grep rfp-n8n

# 如果未運行，啟動 Docker
docker-compose up -d rfp-n8n
```

### 3. 啟動 Next.js dev server

```bash
cd frontend
npm run dev
```

### 4. 驗證連接

```bash
# 測試環境變量是否被讀取
npm run dev  # 應該能看到正確的 webhook URLs

# 測試 API 是否能調用 n8n
curl -X POST http://localhost:3000/api/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

---

## Docker 部署設置

### 生產環境（Docker Container）

#### 方法 1: 使用 `-e` 參數傳入環境變量

```bash
docker build -t aidev-frontend:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  frontend/

docker run -d \
  --name aidev-frontend \
  -p 3000:3000 \
  -e N8N_WEBHOOK_URL=http://n8n-server:5679/webhook/parse-tender \
  -e N8N_INGEST_WEBHOOK=http://n8n-server:5679/webhook/ingest \
  -e N8N_TEMPLATE_PARSE_WEBHOOK=http://n8n-server:5679/webhook/parse-template-v2 \
  -e N8N_DOCUMENT_GENERATE_WEBHOOK=http://n8n-server:5679/webhook/generate-document-v2 \
  -e N8N_WEBHOOK_TEXT_REMOVAL=http://n8n-server:5679/webhook/remove-text \
  -e N8N_IMAGE_GENERATION_WEBHOOK=http://n8n-server:5679/webhook/generate-image \
  -e N8N_INTEGRATE_CHAPTER_WEBHOOK=http://n8n-server:5679/webhook/integrate-chapter \
  -e N8N_BASE_URL=http://n8n-server:5679 \
  aidev-frontend:latest
```

#### 方法 2: 使用 `--env-file` 傳入環境變量（推薦）

1. 創建 `.env.production` 文件：
   ```
   N8N_WEBHOOK_URL=http://n8n-server:5679/webhook/parse-tender
   N8N_INGEST_WEBHOOK=http://n8n-server:5679/webhook/ingest
   # ... 其他變量
   ```

2. 運行容器：
   ```bash
   docker run -d \
     --name aidev-frontend \
     -p 3000:3000 \
     --env-file .env.production \
     aidev-frontend:latest
   ```

#### 方法 3: 使用 Docker Compose

更新 `docker-compose.yml`：

```yaml
services:
  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    ports:
      - "3000:3000"
    environment:
      N8N_WEBHOOK_URL: http://rfp-n8n:5678/webhook/parse-tender
      N8N_INGEST_WEBHOOK: http://rfp-n8n:5678/webhook/ingest
      N8N_TEMPLATE_PARSE_WEBHOOK: http://rfp-n8n:5678/webhook/parse-template-v2
      N8N_DOCUMENT_GENERATE_WEBHOOK: http://rfp-n8n:5678/webhook/generate-document-v2
      N8N_WEBHOOK_TEXT_REMOVAL: http://rfp-n8n:5678/webhook/remove-text
      N8N_IMAGE_GENERATION_WEBHOOK: http://rfp-n8n:5678/webhook/generate-image
      N8N_INTEGRATE_CHAPTER_WEBHOOK: http://rfp-n8n:5678/webhook/integrate-chapter
      N8N_BASE_URL: http://rfp-n8n:5678
    depends_on:
      - rfp-n8n
    networks:
      - aidev_rfp-network
```

---

## 修復細節

### 修改的文件清單

1. **API Routes**（已更新使用環境變量）
   - `frontend/src/app/api/webhook/generate-content/route.ts`
   - `frontend/src/app/api/webhook/generate-image/route.ts`
   - `frontend/src/app/api/webhook/integrate-chapter/route.ts`
   - `frontend/src/app/api/n8n/draft/route.ts`
   - `frontend/src/app/api/n8n/ingest/route.ts`
   - 所有其他 n8n webhook routes

2. **Dockerfile**
   - `frontend/Dockerfile` - 添加了運行時環境變量支持

3. **環境變量文件**
   - `frontend/.env.local` - 已更新為完整配置
   - `frontend/.env.local.example` - 已創建為文檔範本

### 端口統一修復

- ❌ 原來：硬編碼 `localhost:5678`（錯誤的端口）
- ✅ 現在：統一使用 `localhost:5679`（Docker 映射的正確端口）

### 環境變量讀取機制

**之前**（硬編碼）：
```typescript
const N8N_WEBHOOK_URL = 'http://159.223.50.159:5678/webhook/36308c2c-609b-4b92-864e-71d5e73390e7/chat';
```

**現在**（環境變量 + Fallback）：
```typescript
const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5679/webhook/parse-tender';
```

---

## 驗證清單

在部署前，請確認：

- [ ] 所有環境變量都在 `.env.local` 或 `.env.production` 中定義
- [ ] n8n 容器正在運行且可以通過正確的端口訪問
- [ ] Next.js 應用能正確讀取環境變量
- [ ] API routes 能成功調用 n8n webhooks
- [ ] 生產環境的 Dockerfile 能正確接收環境變量

### 測試命令

```bash
# 本地開發環境驗證
cd frontend
node -e "require('dotenv').config(); console.log('N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL)"

# 測試 n8n 連接
curl -I http://localhost:5679/webhook/parse-tender

# 測試 API（需要認證）
curl -X POST http://localhost:3000/api/n8n/draft \
  -H "Content-Type: application/json" \
  -d '{"taskId":"test","requirement":"test"}'
```

---

## 故障排除

### 問題 1: API 返回 `undefined` 環境變量

**症狀**：API 日誌顯示 `N8N_WEBHOOK_URL is undefined`

**解決方案**：
1. 確保 `.env.local` 文件存在且包含正確的變量
2. 重新啟動 Next.js dev server（`npm run dev`）
3. 檢查 `.env.local` 文件的編碼（應為 UTF-8）

### 問題 2: Docker 容器無法連接 n8n

**症狀**：容器內的 API 無法連接到 n8n

**解決方案**：
1. 使用容器內部名稱：`http://rfp-n8n:5678` 而非 `localhost:5679`
2. 確保容器在同一個 Docker 網絡中
3. 檢查 n8n 容器是否正在運行：`docker ps | grep rfp-n8n`

### 問題 3: 生產環境環境變量未被傳入

**症狀**：應用使用 fallback URL 而非預期的生產環境 URL

**解決方案**：
1. 確認使用 `--env-file` 或 `-e` 參數傳入變量
2. 檢查 Dockerfile 中的 `ENV` 聲明是否正確
3. 使用 `docker inspect` 驗證容器環境變量：
   ```bash
   docker inspect aidev-frontend | grep -A 50 '"Env"'
   ```

---

## 下一步

- [ ] 在生產環境測試環境變量傳入
- [ ] 更新 CI/CD 配置以傳入環境變量
- [ ] 文檔化生產環境的 n8n 伺服器地址
- [ ] 定期檢查環境變量配置是否與 n8n 架構同步


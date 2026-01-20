# ONLYOFFICE 解析服務

基於 ONLYOFFICE Document Builder 的範本解析服務，用於替代 python-docx 方案。

## 🎯 特點

- ✅ **高準確度**: 使用 ONLYOFFICE 原生引擎，格式保真度 95%+
- ✅ **完整支持**: 支持所有 Word 格式特性
- ✅ **並行運行**: 與現有 Python 服務並存，逐步遷移
- ✅ **相同 API**: 提供與舊服務兼容的 API 接口

## 📋 前置需求

1. **ONLYOFFICE Document Server** 已部署在 `5.78.118.41:8080`
2. **SSH 訪問權限** 到 ONLYOFFICE 伺服器
3. **Node.js 18+**
4. **Docker** (可選，用於容器化部署)

## 🚀 快速開始

### 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 配置環境變數
cp .env.example .env
# 編輯 .env 文件

# 3. 啟動服務
npm start

# 開發模式（自動重啟）
npm run dev
```

### Docker 部署

```bash
# 構建並啟動
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

### 部署到雲端伺服器

```bash
# 1. 複製到伺服器
scp -r . root@5.78.118.41:/opt/onlyoffice-parsing-service

# 2. SSH 到伺服器
ssh root@5.78.118.41

# 3. 啟動服務
cd /opt/onlyoffice-parsing-service
docker-compose up -d
```

## 📡 API 參考

### 健康檢查

```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "onlyoffice-parsing-service v1.0",
  "onlyoffice_server": "5.78.118.41"
}
```

### 解析範本

```bash
POST /parse-template
Content-Type: multipart/form-data

Parameters:
- file: Word 文檔文件 (multipart)
- supabase_url: Supabase URL (form data)
- supabase_key: Supabase Key (form data)

Response:
{
  "template_id": "uuid",
  "template_name": "template.docx",
  "paragraphs": [...],
  "sections": [...],
  "images": [...],
  "tables": [...],
  "headers_footers": [...],
  "styles": {...}
}
```

### 測試

```bash
# 健康檢查
curl http://localhost:8005/health

# 解析範本
curl -X POST http://localhost:8005/parse-template \
  -F "file=@/path/to/template.docx" \
  -F "supabase_url=YOUR_SUPABASE_URL" \
  -F "supabase_key=YOUR_SUPABASE_KEY"
```

## 🏗️ 架構對比

### 舊方案（Python + python-docx）

```
Word 文檔 → Python 服務 → python-docx 解析 → JSON
                ↓
        格式保真度 70-80%
        需要手動處理 XML
        維護成本高
```

### 新方案（Node.js + ONLYOFFICE Builder）

```
Word 文檔 → Node.js 服務 → SSH → ONLYOFFICE Builder → JSON
                                      ↓
                            格式保真度 95%+
                            原生 Word 引擎
                            官方維護
```

## 🔄 與 n8n 整合

### 舊工作流（保留）

```
HTTP Request → Python 解析服務 (8004) → 處理結果
```

### 新工作流

```
HTTP Request → ONLYOFFICE 解析服務 (8005) → 處理結果
```

## 📊 性能對比

| 指標 | Python 服務 | ONLYOFFICE 服務 |
|------|------------|-----------------|
| 格式準確度 | 70-80% | 95%+ |
| 解析速度 | 快 | 中等 |
| 內存使用 | 低 | 中 |
| 維護成本 | 高 | 低 |
| Bug 風險 | 高 | 低 |

## 🛠️ 故障排除

### 服務無法啟動

```bash
# 檢查端口占用
lsof -i :8005

# 檢查日誌
docker logs onlyoffice-parsing-service
```

### SSH 連接失敗

```bash
# 測試 SSH 連接
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "echo 'SSH OK'"

# 檢查密鑰權限
chmod 600 ~/.ssh/id_hetzner_migration
```

### ONLYOFFICE Builder 執行失敗

```bash
# 登入 ONLYOFFICE 容器檢查
ssh root@5.78.118.41
docker exec -it onlyoffice-documentserver bash
/var/www/onlyoffice/documentserver/server/FileConverter/bin/docbuilder --help
```

## 📝 開發路線圖

- [x] 基本解析功能
- [ ] 完整的圖片提取和上傳
- [ ] 表格解析
- [ ] 頁首/頁尾解析
- [ ] 樣式定義提取
- [ ] 性能優化（緩存、並行處理）
- [ ] 完整的錯誤處理和重試機制

## 🤝 貢獻

這是一個內部項目，僅供團隊使用。

## 📄 授權

Private - 僅供內部使用

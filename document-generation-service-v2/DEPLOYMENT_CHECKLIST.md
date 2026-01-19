# 📋 部署檢查清單

## ✅ 階段 1: 環境準備

- [ ] Docker 已安裝並運行
- [ ] Node.js 18+ 已安裝 (本地測試用)
- [ ] n8n 已啟動 (Port 5678)
- [ ] Supabase 專案已建立
- [ ] 環境變數已設定:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`

---

## ✅ 階段 2: 服務部署

### **2.1 啟動 Document Generation V2**

```bash
cd document-generation-service-v2
chmod +x start.sh
./start.sh
```

**檢查點**:
- [ ] Docker 容器正在運行
- [ ] 健康檢查通過: `curl http://localhost:8005/health`
- [ ] 日誌沒有錯誤: `docker-compose logs`

### **2.2 啟動 Template Parsing Service**

```bash
cd ../template-parsing-service
docker build -t template-parsing-service .
docker run -d -p 8004:8004 --name template-parsing-service template-parsing-service
```

**檢查點**:
- [ ] 服務正在運行: `docker ps | grep template-parsing`
- [ ] 健康檢查通過: `curl http://localhost:8004/health`

---

## ✅ 階段 3: n8n 工作流設定

### **3.1 匯入工作流**

1. [ ] 開啟 n8n: `http://localhost:5678`
2. [ ] 匯入 `n8n-workflows/01-parse-template.json`
3. [ ] 匯入 `n8n-workflows/02-generate-document.json`

### **3.2 設定 Supabase 憑證**

1. [ ] 在 n8n 中新增 Supabase 憑證
2. [ ] 輸入 `SUPABASE_URL`
3. [ ] 輸入 `SUPABASE_SERVICE_KEY`
4. [ ] 測試連線

### **3.3 啟動工作流**

1. [ ] 啟動 `parse-template` 工作流
2. [ ] 啟動 `generate-document` 工作流
3. [ ] 檢查 Webhook URL:
   - [ ] `http://localhost:5678/webhook/parse-template`
   - [ ] `http://localhost:5678/webhook/generate-document`

---

## ✅ 階段 4: Supabase 設定

### **4.1 建立 Storage Buckets**

```sql
-- 在 Supabase SQL Editor 執行

-- 1. 範本檔案 Bucket (已存在則跳過)
INSERT INTO storage.buckets (id, name, public)
VALUES ('raw-files', 'raw-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 生成文件 Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', true)
ON CONFLICT (id) DO NOTHING;
```

**檢查點**:
- [ ] `raw-files` bucket 存在
- [ ] `generated-documents` bucket 存在
- [ ] 兩個 bucket 都是 public

### **4.2 更新 templates 表格**

```sql
-- 新增欄位 (如果不存在)
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS parsed_fields JSONB,
ADD COLUMN IF NOT EXISTS parsed_tables JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
```

**檢查點**:
- [ ] `parsed_fields` 欄位存在
- [ ] `parsed_tables` 欄位存在
- [ ] `status` 欄位存在

### **4.3 建立 generated_documents 表格**

```sql
CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    template_id UUID REFERENCES templates(id),
    file_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- 政策: 用戶只能看到自己的文件
CREATE POLICY "Users can view own documents"
ON generated_documents FOR SELECT
USING (auth.uid() = user_id);
```

**檢查點**:
- [ ] `generated_documents` 表格存在
- [ ] RLS 已啟用
- [ ] 政策已建立

---

## ✅ 階段 5: 測試

### **5.1 測試範本解析**

```bash
# 上傳測試範本
curl -X POST http://localhost:5678/webhook/parse-template \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "test-123",
    "file_path": "raw-files/test_template.docx"
  }'
```

**檢查點**:
- [ ] 回應成功
- [ ] 資料庫中 `templates` 表格已更新
- [ ] `parsed_fields` 有資料

### **5.2 測試文件生成**

```bash
# 生成測試文件
curl -X POST http://localhost:5678/webhook/generate-document \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project",
    "template_id": "test-123",
    "template_file_path": "raw-files/test_template.docx",
    "user_id": "test-user",
    "form_data": {
      "customer_name": "測試公司",
      "project_id": "PRJ-001"
    }
  }'
```

**檢查點**:
- [ ] 回應包含 `download_url`
- [ ] 文件已上傳到 `generated-documents` bucket
- [ ] `generated_documents` 表格有新記錄

### **5.3 測試前端整合**

1. [ ] 上傳範本 → 觸發解析
2. [ ] 查看範本預覽
3. [ ] 填寫表單
4. [ ] 生成文件
5. [ ] 下載文件
6. [ ] 檢查樣式是否保留

---

## ✅ 階段 6: 監控與維護

### **6.1 設定日誌**

```bash
# 查看服務日誌
docker-compose logs -f document-generation-v2
docker logs -f template-parsing-service
```

**檢查點**:
- [ ] 日誌正常輸出
- [ ] 沒有錯誤訊息

### **6.2 效能監控**

- [ ] 文件生成時間 < 5 秒
- [ ] 記憶體使用 < 1GB
- [ ] CPU 使用 < 50%

---

## 🎯 完成!

所有檢查點都完成後,系統就可以正式使用了!

**下一步**:
1. 建立範本庫
2. 訓練用戶使用範本語法
3. 收集反饋並優化

---

## 🐛 常見問題

### **問題 1: n8n 無法連接到服務**

**解決**: 檢查 Docker 網路設定,確保服務在同一網路

```bash
docker network ls
docker network inspect <network_name>
```

### **問題 2: 中文亂碼**

**解決**: 重新 build Docker 映像,確保包含中文字體

```bash
docker-compose build --no-cache
```

### **問題 3: 範本標籤沒有被替換**

**解決**: 檢查範本語法,確保是 `{name}` 而不是 `{ name }`


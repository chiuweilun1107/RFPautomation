# ⚡ 快速開始指南

## 🎯 5 分鐘部署完整系統

### **步驟 1: 啟動服務 (2 分鐘)**

```bash
# 1. 進入目錄
cd document-generation-service-v2

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env,填入您的 SUPABASE_URL

# 3. 啟動服務
./start.sh
```

**預期輸出**:
```
✅ 服務已啟動!
📡 服務資訊:
{
  "status": "healthy",
  "service": "document-generation-v2",
  "engine": "easy-template-x"
}
```

---

### **步驟 2: 匯入 n8n 工作流 (2 分鐘)**

```bash
# 1. 開啟 n8n
open http://localhost:5678

# 2. 點擊右上角 "..." → "Import from File"

# 3. 匯入兩個工作流:
#    - n8n-workflows/01-parse-template.json
#    - n8n-workflows/02-generate-document.json

# 4. 設定 Supabase 憑證 (在工作流中)

# 5. 啟動兩個工作流 (點擊右上角開關)
```

---

### **步驟 3: 建立測試範本 (1 分鐘)**

**在 Word 中建立 `test_template.docx`**:

```
專案提案書

客戶名稱: {customer_name}
專案編號: {project_id}
日期: {date}

工作項目明細:

| 項目 | 工時 | 單價 | 小計 |
|------|------|------|------|
| {#items}{name} | {hours} | {rate} | {total}{/items} |

總計: {total_amount} 元
```

**儲存並上傳到系統**

---

### **步驟 4: 測試 (30 秒)**

```bash
# 執行測試
npm install
npm test
```

**預期輸出**:
```
✅ 通過: 3/3
🎉 所有測試通過!
```

---

## 🎨 範本語法速查

### **變數**
```
{customer_name}
{project_id}
{date}
```

### **動態表格**
```
| 項目 | 數量 |
|------|------|
| {#items}{name} | {quantity}{/items} |
```

### **條件**
```
{#if score >= 60}
通過
{/if}
```

---

## 📊 完整流程

```
1. 上傳範本 (.docx)
   ↓
2. n8n 自動解析欄位
   ↓
3. 前端顯示表單
   ↓
4. 用戶填寫資料
   ↓
5. n8n 生成文件 (100% 保留樣式)
   ↓
6. 下載 .docx
```

---

## 🔧 故障排除

### **服務無法啟動**
```bash
# 檢查 Docker
docker ps

# 查看日誌
docker-compose logs
```

### **n8n 無法連接**
```bash
# 檢查網路
docker network inspect ai-dev_default

# 確保服務在同一網路
```

### **範本沒有被替換**
- 檢查標籤格式: `{name}` ✅ 不是 `{ name }` ❌
- 確保表格循環在同一列

---

## 📚 下一步

1. **閱讀完整文件**: `README.md`
2. **學習範本語法**: `TEMPLATE_GUIDE.md`
3. **查看部署清單**: `DEPLOYMENT_CHECKLIST.md`

---

**🎉 開始使用!**


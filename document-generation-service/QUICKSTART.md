# 🚀 快速開始指南

## 5 分鐘部署 Document Generation Service

---

## 📋 前置需求

- ✅ Docker Desktop (已安裝)
- ✅ Mac M5 (ARM64 架構)
- ✅ 8GB+ RAM
- ✅ n8n 服務運行中

---

## 🎯 Step 1: 啟動服務 (2 分鐘)

```bash
# 進入服務目錄
cd document-generation-service

# 建立範本目錄
mkdir -p templates output

# 啟動服務
docker-compose up -d --build
```

**預期輸出**:
```
✅ Container document-generation-service  Started
```

---

## 🧪 Step 2: 健康檢查 (30 秒)

```bash
curl http://localhost:8003/health
```

**預期輸出**:
```json
{
  "status": "healthy",
  "service": "document-generation",
  "libreoffice": "LibreOffice 7.x.x.x"
}
```

---

## 📝 Step 3: 建立第一個範本 (2 分鐘)

### 3.1 開啟 Microsoft Word

建立新文件,輸入以下內容:

```
標案回應書

客戶名稱: {{ customer_name }}
專案編號: {{ project_id }}
專案名稱: {{ project_name }}

一、報價明細

{% tr for item in items %}
{{ item.name }} | {{ item.quantity }} | NT$ {{ item.price }}
{% endtr %}

總金額: NT$ {{ total_budget }}
```

### 3.2 儲存範本

- 檔名: `rfp_response.docx`
- 位置: `document-generation-service/templates/`

---

## 🎨 Step 4: 測試生成文件 (1 分鐘)

```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=rfp_response.docx" \
  -F 'context_json={
    "customer_name": "台灣科技股份有限公司",
    "project_id": "RFP-2025-001",
    "project_name": "智慧城市管理系統",
    "total_budget": 5000000,
    "items": [
      {"name": "系統開發", "quantity": 1, "price": 3000000},
      {"name": "維護服務", "quantity": 12, "price": 50000}
    ]
  }' \
  -F "output_format=pdf" \
  -o test_output.pdf
```

**檢查結果**:
```bash
open test_output.pdf
```

---

## 🔗 Step 5: 整合到 n8n (5 分鐘)

### 5.1 匯入 Workflow

1. 開啟 n8n: http://localhost:5678
2. 點擊 **Import from File**
3. 選擇 `n8n-workflow-example.json`
4. 點擊 **Import**

### 5.2 配置 Supabase 憑證

1. 點擊 **Upload to Supabase** 節點
2. 選擇您的 Supabase 憑證
3. 儲存 Workflow

### 5.3 啟動 Workflow

1. 點擊右上角 **Active** 開關
2. 複製 Webhook URL

### 5.4 測試完整流程

```bash
curl -X POST <YOUR_WEBHOOK_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "請為台灣科技公司的智慧城市專案生成一份 RFP 回應書,預算 500 萬,包含系統開發和維護服務",
    "template_name": "rfp_response.docx",
    "output_format": "pdf"
  }'
```

**預期輸出**:
```json
{
  "success": true,
  "message": "文件生成成功",
  "file_url": "https://your-supabase-url/storage/v1/object/public/rfp-documents/generated_20250101120000.pdf",
  "file_name": "generated_20250101120000.pdf",
  "format": "pdf"
}
```

---

## 🎉 完成!

您現在已經成功部署了 Document Generation Service!

---

## 📚 下一步

### 進階功能

1. **設計更複雜的範本**
   - 參考 `TEMPLATE_GUIDE.md`
   - 使用條件判斷、循環、過濾器

2. **優化 AI Prompt**
   - 調整 n8n 中的 AI Agent 節點
   - 產出更精確的 JSON 數據

3. **自定義樣式**
   - 在 Word 範本中設定字體、顏色、間距
   - 使用「樣式」功能統一格式

### 效能優化

1. **增加記憶體限制**
   ```yaml
   # docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 8G  # 從 4G 增加到 8G
   ```

2. **啟用快取**
   ```python
   # service.py
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def load_template(template_name):
       return DocxTemplate(TEMPLATES_DIR / template_name)
   ```

3. **水平擴展**
   ```yaml
   # docker-compose.yml
   deploy:
     replicas: 3  # 啟動 3 個實例
   ```

---

## 🐛 故障排除

### 問題 1: 服務無法啟動

**檢查**:
```bash
docker logs document-generation-service
```

**常見原因**:
- 端口 8003 被佔用 → 修改 `docker-compose.yml` 中的端口
- 記憶體不足 → 關閉其他 Docker 容器

### 問題 2: PDF 中文亂碼

**解決**:
```bash
# 重新 build image (確保字體安裝)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 問題 3: 範本找不到

**檢查**:
```bash
docker exec -it document-generation-service ls -la /app/templates
```

**解決**:
```bash
# 確保範本在正確位置
cp your_template.docx document-generation-service/templates/
```

### 問題 4: LibreOffice 轉檔失敗

**檢查**:
```bash
docker exec -it document-generation-service soffice --version
```

**解決**:
```bash
# 重新安裝 LibreOffice
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 效能監控

### 查看資源使用

```bash
docker stats document-generation-service
```

### 查看日誌

```bash
# 即時日誌
docker logs -f document-generation-service

# 最近 100 行
docker logs --tail 100 document-generation-service
```

### 測試效能

```bash
# 執行壓力測試
chmod +x test_service.sh
./test_service.sh
```

---

## 🔒 安全建議

1. **不要在生產環境暴露 8003 端口**
   - 只允許 n8n 容器訪問
   - 使用 Docker network

2. **限制上傳檔案大小**
   ```python
   # service.py
   app.add_middleware(
       RequestSizeLimitMiddleware,
       max_request_size=10 * 1024 * 1024  # 10MB
   )
   ```

3. **驗證範本來源**
   - 只允許管理員上傳範本
   - 掃描惡意巨集

---

## 📞 需要幫助?

- 📖 查看 `README.md` - 完整文檔
- 📝 查看 `TEMPLATE_GUIDE.md` - 範本設計指南
- 📊 查看 `FEASIBILITY_REPORT.md` - 可行性評估
- 🐛 查看 Docker logs - 錯誤訊息

---

**祝您使用愉快! 🎉**


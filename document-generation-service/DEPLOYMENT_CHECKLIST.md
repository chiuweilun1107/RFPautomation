# ✅ 部署檢查清單

## 📋 部署前檢查

### 環境需求
- [ ] Docker Desktop 已安裝並運行
- [ ] 可用記憶體 ≥ 8GB
- [ ] 可用磁碟空間 ≥ 10GB
- [ ] n8n 服務正常運行 (http://localhost:5678)
- [ ] Supabase 專案已建立

---

## 🚀 Phase 1: 服務部署 (預計 10 分鐘)

### Step 1: 建立服務
```bash
cd document-generation-service
docker-compose up -d --build
```

**檢查點**:
- [ ] Docker image 建構成功
- [ ] 容器啟動成功
- [ ] 無錯誤訊息

### Step 2: 健康檢查
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

**檢查點**:
- [ ] 服務回應正常
- [ ] LibreOffice 版本顯示正確
- [ ] 回應時間 < 1 秒

### Step 3: 查看日誌
```bash
docker logs document-generation-service
```

**檢查點**:
- [ ] 無 ERROR 級別日誌
- [ ] 服務啟動訊息正常
- [ ] 端口綁定成功 (0.0.0.0:8003)

---

## 📝 Phase 2: 範本準備 (預計 20 分鐘)

### Step 1: 建立測試範本

**使用 Microsoft Word 建立檔案**: `test_template.docx`

**內容範例**:
```
標案回應書

客戶名稱: {{ customer_name }}
專案編號: {{ project_id }}

報價明細:
{% tr for item in items %}
{{ item.name }} | {{ item.quantity }} | NT$ {{ item.price }}
{% endtr %}

總金額: NT$ {{ total_budget }}
```

**檢查點**:
- [ ] 檔案格式為 .docx (不是 .doc)
- [ ] 所有標籤語法正確
- [ ] 樣式設定完整

### Step 2: 上傳範本
```bash
cp test_template.docx document-generation-service/templates/
```

或使用 API:
```bash
curl -X POST http://localhost:8003/upload-template \
  -F "file=@test_template.docx"
```

**檢查點**:
- [ ] 檔案上傳成功
- [ ] 檔案出現在 templates/ 目錄
- [ ] 檔案權限正確

### Step 3: 測試生成
```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=test_template.docx" \
  -F 'context_json={"customer_name":"測試公司","project_id":"TEST-001","items":[{"name":"項目1","quantity":1,"price":1000}],"total_budget":1000}' \
  -F "output_format=docx" \
  -o test_output.docx
```

**檢查點**:
- [ ] 文件生成成功
- [ ] 檔案大小 > 0
- [ ] 可以用 Word 開啟
- [ ] 內容正確填入

---

## 🔗 Phase 3: n8n 整合 (預計 15 分鐘)

### Step 1: 匯入 Workflow
1. 開啟 n8n: http://localhost:5678
2. 點擊 **Import from File**
3. 選擇 `n8n-workflow-example.json`
4. 點擊 **Import**

**檢查點**:
- [ ] Workflow 匯入成功
- [ ] 所有節點顯示正常
- [ ] 無錯誤提示

### Step 2: 配置憑證

**Supabase 憑證**:
1. 點擊 "Upload to Supabase" 節點
2. 新增憑證:
   - URL: `https://goyonrowhfphooryfzif.supabase.co`
   - Service Role Key: (從 Supabase 專案設定取得)

**OpenAI 憑證**:
1. 點擊 "AI Generate JSON" 節點
2. 新增憑證:
   - API Key: (您的 OpenAI API Key)

**檢查點**:
- [ ] Supabase 憑證測試成功
- [ ] OpenAI 憑證測試成功
- [ ] 所有節點無紅色警告

### Step 3: 啟動 Workflow
1. 點擊右上角 **Active** 開關
2. 複製 Webhook URL

**檢查點**:
- [ ] Workflow 狀態為 Active
- [ ] Webhook URL 已複製

### Step 4: 測試完整流程
```bash
curl -X POST <YOUR_WEBHOOK_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "請為測試公司生成一份報價單,包含系統開發 100 萬和維護服務 50 萬",
    "template_name": "test_template.docx",
    "output_format": "pdf"
  }'
```

**檢查點**:
- [ ] 請求成功 (HTTP 200)
- [ ] 返回 file_url
- [ ] 可以從 Supabase Storage 下載文件
- [ ] PDF 內容正確

---

## 🧪 Phase 4: 測試驗證 (預計 10 分鐘)

### 功能測試

**測試 1: Docx 生成**
```bash
./test_service.sh
```
- [ ] 測試通過

**測試 2: PDF 生成**
- [ ] PDF 可以開啟
- [ ] 中文顯示正常
- [ ] 排版正確

**測試 3: 表格循環**
- [ ] 表格自動擴展
- [ ] 數據正確填入

**測試 4: 條件判斷**
- [ ] if/else 邏輯正確

### 效能測試

**測試 1: 回應時間**
- [ ] 小文件 (< 10 頁): < 5 秒
- [ ] 中型文件 (10-30 頁): < 15 秒

**測試 2: 並發測試**
```bash
# 同時發送 5 個請求
for i in {1..5}; do
  curl -X POST http://localhost:8003/generate ... &
done
wait
```
- [ ] 所有請求成功
- [ ] 無記憶體溢出

### 錯誤處理測試

**測試 1: 範本不存在**
```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=not_exist.docx" \
  -F 'context_json={}' \
  -F "output_format=docx"
```
- [ ] 返回 404 錯誤
- [ ] 錯誤訊息清晰

**測試 2: JSON 格式錯誤**
```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=test_template.docx" \
  -F 'context_json={invalid json}' \
  -F "output_format=docx"
```
- [ ] 返回 400 錯誤
- [ ] 錯誤訊息清晰

---

## 🔒 Phase 5: 安全檢查 (預計 5 分鐘)

### 網路安全
- [ ] Document Service 不暴露到公網
- [ ] 只允許 n8n 容器訪問
- [ ] 使用 Docker network 隔離

### 輸入驗證
- [ ] 範本名稱白名單檢查
- [ ] JSON 格式驗證
- [ ] 檔案大小限制

### 資源限制
- [ ] Docker memory limit 設定
- [ ] CPU limit 設定
- [ ] 請求超時設定

---

## 📊 Phase 6: 監控設定 (預計 5 分鐘)

### 日誌監控
```bash
# 設定日誌輪轉
docker-compose logs -f --tail=100 document-generation
```
- [ ] 日誌正常輸出
- [ ] 無異常錯誤

### 資源監控
```bash
docker stats document-generation-service
```
- [ ] CPU 使用率 < 50%
- [ ] 記憶體使用 < 2GB
- [ ] 無記憶體洩漏

---

## ✅ 部署完成檢查

### 最終驗證
- [ ] 所有服務正常運行
- [ ] 健康檢查通過
- [ ] 範本上傳成功
- [ ] 文件生成成功
- [ ] n8n 整合成功
- [ ] 測試全部通過
- [ ] 監控正常運作

### 文檔確認
- [ ] 已閱讀 EXECUTIVE_SUMMARY.md
- [ ] 已閱讀 QUICKSTART.md
- [ ] 已閱讀 TEMPLATE_GUIDE.md
- [ ] 已閱讀 README.md

---

## 🎉 部署成功!

**下一步**:
1. 設計生產環境範本
2. 優化 AI Prompt
3. 監控系統效能
4. 收集用戶反饋

**需要幫助?**
- 查看 `README.md` 故障排除章節
- 查看 Docker logs
- 聯繫技術支援

---

**部署日期**: _______________  
**部署人員**: _______________  
**驗證人員**: _______________


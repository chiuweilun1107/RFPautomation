# Document Generation Service

## 📋 功能特色

✅ **高保真度** - 完美保留 Word 原始樣式  
✅ **Jinja2 模板** - 支援變數、循環、條件判斷  
✅ **中文支援** - 內建中文字體,PDF 不亂碼  
✅ **雙格式輸出** - 支援 Docx 和 PDF  
✅ **ARM64 相容** - Mac M1/M2/M5 可直接運行  

---

## 🚀 快速開始

### 1. 啟動服務

```bash
cd document-generation-service
docker-compose up -d --build
```

### 2. 檢查健康狀態

```bash
curl http://localhost:8003/health
```

預期輸出:
```json
{
  "status": "healthy",
  "service": "document-generation",
  "libreoffice": "LibreOffice 7.x.x.x"
}
```

---

## 📝 Word 範本製作指南

### 基本語法 (Jinja2)

#### 1. 變數插入
```
客戶名稱: {{ customer_name }}
專案編號: {{ project_id }}
```

#### 2. 條件判斷
```
{% if score >= 60 %}
評等: 及格
{% else %}
評等: 不及格
{% endif %}
```

#### 3. 循環列表 (表格)

在 Word 表格中,選取**整列**,插入以下標籤:

| 項目 | 數量 | 單價 |
|------|------|------|
| {% for item in items %}{{ item.name }}{% endfor %} | {{ item.quantity }} | {{ item.price }} |

**重要**: 
- `{% for %}` 和 `{% endfor %}` 必須在**同一列**
- 系統會自動向下複製該列

#### 4. 格式化數字/日期

```
金額: {{ total_amount | format_currency }}
日期: {{ today | format_date }}
```

---

## 🔧 API 使用範例

### 生成 Word 文件

```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=rfp_response.docx" \
  -F 'context_json={
    "customer_name": "台灣科技公司",
    "project_id": "RFP-2025-001",
    "items": [
      {"name": "系統開發", "quantity": 1, "price": 500000},
      {"name": "維護服務", "quantity": 12, "price": 50000}
    ],
    "total_amount": 1100000
  }' \
  -F "output_format=docx" \
  -o generated.docx
```

### 生成 PDF 文件

```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=rfp_response.docx" \
  -F 'context_json={"customer_name": "測試公司"}' \
  -F "output_format=pdf" \
  -o generated.pdf
```

### 上傳新範本

```bash
curl -X POST http://localhost:8003/upload-template \
  -F "file=@my_template.docx"
```

---

## 🔗 n8n 整合範例

### Workflow 節點配置

1. **AI Agent 節點** - 生成 JSON 數據
2. **HTTP Request 節點** - 調用文件生成服務

```javascript
// HTTP Request 節點設定
{
  "method": "POST",
  "url": "http://document-generation-service:8003/generate",
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "template_name",
        "value": "rfp_response.docx"
      },
      {
        "name": "context_json",
        "value": "={{ JSON.stringify($json) }}"
      },
      {
        "name": "output_format",
        "value": "pdf"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "file"
      }
    }
  }
}
```

3. **Supabase Storage 節點** - 上傳生成的文件

---

## 📂 目錄結構

```
document-generation-service/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── service.py
├── templates/          # 放置 Word 範本
│   └── rfp_response.docx
└── output/            # 生成的文件
```

---

## ⚠️ 注意事項

### 1. 中文字體問題
Dockerfile 已內建以下字體:
- Noto Sans CJK (思源黑體)
- WenQuanYi Zen Hei (文泉驛正黑)

如需其他字體,修改 Dockerfile:
```dockerfile
RUN apt-get install -y fonts-your-font
```

### 2. 記憶體限制
- 小文件 (<10頁): 2GB RAM
- 中型文件 (10-50頁): 4GB RAM
- 大型文件 (>50頁): 8GB RAM

### 3. PDF 轉檔時間
- LibreOffice 轉檔約需 5-15 秒
- 建議設定 n8n 節點 timeout 為 60 秒

---

## 🆚 與其他方案比較

| 方案 | 授權 | 中文支援 | 複雜度 | 推薦度 |
|------|------|---------|--------|--------|
| **python-docx-template** | MIT | ⭐⭐⭐⭐⭐ | 低 | ⭐⭐⭐⭐⭐ |
| easy-template-x | MIT | ⭐⭐⭐ | 中 | ⭐⭐⭐⭐ |
| Docxtemplater | 商業授權 | ⭐⭐⭐⭐ | 低 | ⭐⭐⭐ |
| Carbone | 商業授權 | ⭐⭐⭐⭐ | 中 | ⭐⭐ |

---

## 🐛 故障排除

### 問題 1: PDF 中文亂碼
**解決**: 重新 build Docker image,確保字體已安裝
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 問題 2: LibreOffice 轉檔失敗
**檢查**: 
```bash
docker exec -it document-generation-service soffice --version
```

### 問題 3: 範本找不到
**檢查**: 
```bash
docker exec -it document-generation-service ls -la /app/templates
```

---

## 📞 技術支援

如有問題,請查看日誌:
```bash
docker logs -f document-generation-service
```


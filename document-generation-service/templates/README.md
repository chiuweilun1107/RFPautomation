# Word 範本目錄

## 📁 目錄說明

此目錄用於存放 Word 範本檔案 (.docx)。

---

## 📝 範本命名規範

建議使用以下命名格式:
```
<用途>_<版本>.docx
```

範例:
- `rfp_response_v1.docx` - RFP 回應書 v1
- `quotation_standard.docx` - 標準報價單
- `contract_template.docx` - 合約範本

---

## 🎨 範本設計建議

### 1. 使用 Word 內建樣式

✅ **推薦做法**:
- 標題使用「標題 1」、「標題 2」
- 內文使用「內文」樣式
- 表格使用「表格樣式」

❌ **避免**:
- 手動設定每個段落的字體和大小
- 使用空格或 Tab 對齊

### 2. 預留足夠邊距

- 上下邊距: 2.5 cm
- 左右邊距: 2.0 cm
- 頁首頁尾: 1.5 cm

### 3. 字體選擇

**中文字體** (推薦):
- 標題: 微軟正黑體 (Microsoft JhengHei)
- 內文: 新細明體 (PMingLiU)

**英文字體** (推薦):
- 標題: Arial Bold
- 內文: Arial

### 4. 表格設計

- 使用「插入表格」功能
- 設定固定欄寬
- 啟用「標題列重複」(多頁表格)

---

## 🔧 Jinja2 語法快速參考

### 變數插入
```
{{ variable_name }}
```

### 表格循環
```
{% tr for item in items %}
{{ item.name }} | {{ item.value }}
{% endtr %}
```

### 條件判斷
```
{% if condition %}
顯示此內容
{% endif %}
```

### 過濾器
```
{{ number | format_number }}
{{ date | strftime('%Y-%m-%d') }}
```

---

## 📋 範本範例

### 範例 1: 簡單報價單

```
報價單

客戶名稱: {{ customer_name }}
報價日期: {{ quote_date }}

項目明細:

{% tr for item in items %}
{{ item.name }} | {{ item.quantity }} | NT$ {{ item.price }} | NT$ {{ item.quantity * item.price }}
{% endtr %}

總計: NT$ {{ total_amount }}
```

### 範例 2: RFP 回應書

```
標案回應書

一、基本資料
標案編號: {{ rfp_id }}
投標廠商: {{ company_name }}
專案名稱: {{ project_name }}

二、團隊組成

{% tr for member in team %}
{{ member.name }} | {{ member.role }} | {{ member.experience }} 年
{% endtr %}

三、專案時程

{% tr for milestone in milestones %}
{{ milestone.phase }} | {{ milestone.duration }} 個月 | {{ milestone.deliverable }}
{% endtr %}

四、預算說明
總預算: NT$ {{ total_budget }}

{% if total_budget > 3000000 %}
本專案屬於大型專案...
{% else %}
本專案屬於中小型專案...
{% endif %}
```

---

## 🧪 測試範本

### 方法 1: 使用 API

```bash
curl -X POST http://localhost:8003/generate \
  -F "template_name=your_template.docx" \
  -F 'context_json={"customer_name": "測試公司"}' \
  -F "output_format=docx" \
  -o test_output.docx
```

### 方法 2: 使用測試腳本

```bash
cd ..
./test_service.sh
```

---

## 📤 上傳範本

### 方法 1: 直接複製

```bash
cp /path/to/your_template.docx ./templates/
```

### 方法 2: 使用 API

```bash
curl -X POST http://localhost:8003/upload-template \
  -F "file=@/path/to/your_template.docx"
```

---

## ⚠️ 注意事項

1. **檔案格式**: 只接受 `.docx` 格式 (不支援 `.doc`)
2. **檔案大小**: 建議 < 5MB
3. **巨集**: 不支援含有巨集的範本 (.docm)
4. **密碼保護**: 不支援密碼保護的文件
5. **唯讀**: 範本檔案會被設為唯讀,不會被修改

---

## 🔍 範本驗證清單

上傳範本前,請確認:

- [ ] 檔案格式為 `.docx`
- [ ] 所有 Jinja2 標籤語法正確
- [ ] 表格循環使用 `{% tr %}` 和 `{% endtr %}`
- [ ] 變數名稱與 JSON 數據一致
- [ ] 樣式設定完整 (字體、大小、顏色)
- [ ] 頁首頁尾設定正確
- [ ] 邊距設定合理
- [ ] 測試過至少一次生成

---

## 📚 更多資源

- [Jinja2 官方文檔](https://jinja.palletsprojects.com/)
- [python-docx-template GitHub](https://github.com/elapouya/python-docx-template)
- [Word 樣式設計指南](https://support.microsoft.com/zh-tw/office/word-styles)

---

**需要幫助?** 請查看 `../TEMPLATE_GUIDE.md` 獲取完整的範本設計指南。


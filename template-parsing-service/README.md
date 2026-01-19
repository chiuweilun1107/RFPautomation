# 📄 Word 範本解析服務

## 🎯 核心功能

**自動解析 Word 文件,識別可填寫欄位,生成動態表單**

### ✅ 支援的檢測規則

1. **下劃線欄位**: `客戶名稱: _______________`
2. **方括號欄位**: `專案編號: 【　】`
3. **關鍵字欄位**: `請填寫公司簡介:`
4. **空白表格**: 自動識別可填寫的表格

---

## 🚀 快速開始

### 1. 啟動服務

```bash
cd template-parsing-service
docker-compose up -d --build
```

### 2. 測試解析

```bash
curl -X POST http://localhost:8004/parse-template \
  -F "file=@your_template.docx"
```

### 3. 查看結果

```json
{
  "template_id": "abc-123",
  "template_name": "投標書範本.docx",
  "fields": [
    {
      "name": "field_1",
      "label": "客戶名稱",
      "type": "text",
      "required": true,
      "placeholder": "請輸入客戶名稱",
      "position": {"paragraph_index": 5, "pattern": "underline"},
      "style": {"font_name": "微軟正黑體", "font_size": 12}
    }
  ],
  "tables": [
    {
      "name": "table_1",
      "label": "報價明細",
      "columns": [
        {"name": "item", "label": "項目", "type": "text"},
        {"name": "quantity", "label": "數量", "type": "number"},
        {"name": "price", "label": "單價", "type": "number"}
      ]
    }
  ]
}
```

---

## 📝 使用範例

### 範例 1: 標案投標書

**原始 Word 文件**:
```
投標書

一、基本資料
公司名稱: _______________
統一編號: _______________
聯絡電話: _______________

二、報價明細
┌────────┬────────┬────────┐
│ 項目   │ 數量   │ 單價   │
├────────┼────────┼────────┤
│        │        │        │
└────────┴────────┴────────┘

三、公司簡介
請填寫公司簡介:
```

**解析結果**:
- 3 個文字欄位 (公司名稱、統一編號、聯絡電話)
- 1 個表格 (報價明細)
- 1 個多行文字欄位 (公司簡介)

---

### 範例 2: 提案書範本

**原始 Word 文件**:
```
專案提案書

客戶名稱: 【　】
專案名稱: 【　】
預算金額: 【　】

專案說明:
請填寫專案說明
```

**解析結果**:
- 3 個文字欄位 (客戶名稱、專案名稱、預算金額)
- 1 個多行文字欄位 (專案說明)

---

## 🔧 檢測規則詳解

### 規則 1: 下劃線檢測

**觸發條件**: 段落包含 3 個以上連續的下劃線 `___`

**範例**:
```
客戶名稱: _______________  ✅ 檢測為文字欄位
電話: __  ❌ 下劃線太短,不檢測
```

**提取邏輯**:
- 標籤 = 下劃線前的文字
- 欄位類型 = text
- 佔位符 = "請輸入{標籤}"

---

### 規則 2: 方括號檢測

**觸發條件**: 段落包含 `【　】` 或 `〔　〕`

**範例**:
```
專案編號: 【　】  ✅ 檢測為文字欄位
備註: 【已完成】  ❌ 方括號內有文字,不檢測
```

---

### 規則 3: 關鍵字檢測

**觸發條件**: 段落包含 `請填寫` 或 `填寫說明`

**範例**:
```
請填寫公司簡介:  ✅ 檢測為多行文字欄位 (textarea)
填寫說明: 本欄位為必填  ✅ 檢測為多行文字欄位
```

**欄位類型**: 自動設為 `textarea` (多行文字)

---

### 規則 4: 表格檢測

**觸發條件**:
1. 表格至少有 2 列 (標題列 + 數據列)
2. 至少有一列是空白的

**範例**:
```
┌────────┬────────┬────────┐
│ 項目   │ 數量   │ 單價   │  ← 標題列
├────────┼────────┼────────┤
│        │        │        │  ← 空白列 ✅ 檢測為可填寫表格
└────────┴────────┴────────┘
```

**自動推斷欄位類型**:
- 包含 "數量", "金額", "價格" → `number`
- 包含 "日期", "時間" → `date`
- 其他 → `text`

---

## 🎨 樣式提取

系統會自動提取每個欄位的樣式:

```json
{
  "style": {
    "font_name": "微軟正黑體",
    "font_size": 12,
    "bold": false,
    "italic": false,
    "color": "#000000",
    "alignment": "LEFT"
  }
}
```

這些樣式會在生成新文件時**完全保留**!

---

## 🔗 整合到前端

### Step 1: 上傳範本

```tsx
const uploadTemplate = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('http://localhost:8004/parse-template', {
    method: 'POST',
    body: formData
  })
  
  const schema = await response.json()
  return schema
}
```

### Step 2: 動態生成表單

```tsx
const DynamicForm = ({ schema }) => {
  return (
    <form>
      {schema.fields.map(field => (
        <div key={field.name}>
          <label>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea 
              name={field.name}
              placeholder={field.placeholder}
            />
          ) : (
            <input 
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}
      
      {schema.tables.map(table => (
        <DynamicTable key={table.name} schema={table} />
      ))}
    </form>
  )
}
```

---

## ⚠️ 限制與注意事項

1. **只支援 .docx 格式** (不支援 .doc)
2. **複雜排版可能無法完美識別** (例如:多欄排版)
3. **需要明確的欄位標記** (下劃線、方括號等)
4. **表格必須有標題列**

---

## 🚀 下一步

1. 整合到前端 (Knowledge 或 Writing 頁面)
2. 新增「手動標註」功能 (用戶點選欄位)
3. 新增「AI 視覺識別」功能 (GPT-4 Vision)
4. 實作「文件生成」功能 (填入數據後生成新文件)

---

**這才是您真正需要的方案!** 🎯


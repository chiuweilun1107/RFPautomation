# 📄 Word 文件樣式克隆系統

## 🎯 核心功能

這是一個**自動解析 Word 文件樣式並生成動態表單**的系統,讓用戶可以:

1. ✅ 上傳任意 Word 文件
2. ✅ 系統自動解析文件結構和樣式
3. ✅ 自動識別可填寫欄位
4. ✅ 前端動態生成表單
5. ✅ 用戶填寫後生成**樣式完全一致**的新文件

---

## 🏗️ 系統架構

```
用戶上傳 Word 文件
    ↓
[解析服務] 提取樣式 + 識別欄位
    ↓
生成 JSON Schema
    ↓
[前端] 動態渲染表單
    ↓
用戶填寫數據
    ↓
[生成服務] 套用原始樣式 + 填入數據
    ↓
輸出新文件 (Docx/PDF)
```

---

## 🔧 技術方案

### 方案 A: python-docx (推薦)

**優點**:
- ✅ 可以完整讀取 Word 樣式 (字體、段落、表格)
- ✅ 可以精確複製樣式到新文件
- ✅ 與您現有的 Python 服務一致

**缺點**:
- ⚠️ 需要手動識別「可填寫欄位」(沒有自動檢測)
- ⚠️ 複雜排版可能需要額外處理

### 方案 B: python-docx + AI 識別

**優點**:
- ✅ 使用 AI (GPT-4 Vision) 識別可填寫區域
- ✅ 更智能的欄位檢測

**缺點**:
- ⚠️ 需要 AI API 成本
- ⚠️ 準確度依賴 AI 模型

### 方案 C: 用戶手動標記 + python-docx

**優點**:
- ✅ 最準確 (用戶自己標記)
- ✅ 實作簡單

**缺點**:
- ⚠️ 需要用戶學習標記語法

---

## 💡 推薦實作方案

### **混合方案: 自動檢測 + 手動標記**

1. **自動檢測** (啟發式規則):
   - 空白表格儲存格 → 可填寫欄位
   - 包含 `___` 或 `【　】` 的段落 → 可填寫欄位
   - 包含 `{{變數名}}` 的段落 → 可填寫欄位

2. **手動標記** (可選):
   - 用戶可以在 Word 中插入 `{{customer_name}}` 等標記
   - 系統自動識別並生成對應表單欄位

---

## 📝 使用範例

### Step 1: 上傳文件

用戶上傳包含以下內容的 Word 文件:

```
標案回應書

客戶名稱: _______________
專案編號: _______________

報價明細:
┌────────┬────────┬────────┐
│ 項目   │ 數量   │ 單價   │
├────────┼────────┼────────┤
│        │        │        │
└────────┴────────┴────────┘

總金額: _______________
```

### Step 2: 系統解析

系統自動識別:
- `客戶名稱` → 文字輸入欄位
- `專案編號` → 文字輸入欄位
- 表格 → 動態表格 (可新增列)
- `總金額` → 數字輸入欄位

### Step 3: 前端表單

```tsx
<Form>
  <Input label="客戶名稱" name="customer_name" />
  <Input label="專案編號" name="project_id" />
  
  <DynamicTable name="items">
    <Column name="name" label="項目" />
    <Column name="quantity" label="數量" type="number" />
    <Column name="price" label="單價" type="number" />
  </DynamicTable>
  
  <Input label="總金額" name="total" type="number" />
</Form>
```

### Step 4: 生成文件

系統生成的新文件**完全保留原始樣式**:
- 字體、大小、顏色
- 段落間距、對齊方式
- 表格邊框、底色

---

## 🚀 快速開始

```bash
cd document-style-cloning-service
docker-compose up -d --build
```

---

## 📚 API 文檔

### 1. 解析文件

```bash
POST /parse-template
Content-Type: multipart/form-data

file: <Word 文件>
```

**回應**:
```json
{
  "template_id": "uuid",
  "fields": [
    {
      "name": "customer_name",
      "label": "客戶名稱",
      "type": "text",
      "required": true
    },
    {
      "name": "items",
      "label": "報價明細",
      "type": "table",
      "columns": [
        {"name": "name", "label": "項目", "type": "text"},
        {"name": "quantity", "label": "數量", "type": "number"},
        {"name": "price", "label": "單價", "type": "number"}
      ]
    }
  ],
  "styles": {
    "font": "微軟正黑體",
    "size": 12,
    "...": "..."
  }
}
```

### 2. 生成文件

```bash
POST /generate
Content-Type: application/json

{
  "template_id": "uuid",
  "data": {
    "customer_name": "台灣科技公司",
    "project_id": "RFP-2025-001",
    "items": [
      {"name": "系統開發", "quantity": 1, "price": 500000}
    ],
    "total": 500000
  },
  "output_format": "pdf"
}
```

---

## ⚠️ 重要說明

這個方案與之前的 `document-generation-service` 完全不同:

| 項目 | 之前的方案 | 正確的方案 |
|------|-----------|-----------|
| 範本來源 | 手動設計 + 插入標籤 | **自動解析上傳的文件** |
| 欄位識別 | 手動定義 | **自動檢測** |
| 樣式處理 | 預先設計好 | **動態複製原始樣式** |
| 前端表單 | 固定 | **動態生成** |

---

**這才是您真正需要的方案!** 🎯


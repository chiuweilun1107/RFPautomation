# 範本生成服務 (Template Generation Service)

基於 **docxtemplater** 的 DOCX 範本填充服務，完美保留所有格式。

---

## 🎯 **核心功能**

- ✅ **完全保留格式** - 字體、顏色、對齊、縮排、頁首頁尾
- ✅ **簡單佔位符** - 使用 `{變數名}` 語法
- ✅ **迴圈支援** - 自動生成列表、表格
- ✅ **條件邏輯** - if/else 判斷
- ✅ **圖片插入** - 支援動態圖片
- ✅ **Supabase 整合** - 直接上傳生成的文檔

---

## 📦 **快速開始**

### 本地運行

```bash
cd template-generation-service
npm install
npm start
```

服務運行在 `http://localhost:8007`

### Docker 部署

```bash
docker-compose up -d
```

---

## 📝 **Step 1: 準備範本**

### 基本佔位符

在 Word 文檔中使用 `{變數名}` 語法：

```
目錄

壹、{chapter1_title}
一、{section1_title}...........................{section1_page}
二、{section2_title}...........................{section2_page}

貳、{chapter2_title}
```

### 迴圈（列表）

```
目錄

{#chapters}
{title}
  {#sections}
  {index}、{name}...........................{page}
  {/sections}
{/chapters}
```

### 條件判斷

```
{#hasIntroduction}
前言
{content}
{/hasIntroduction}

{^hasIntroduction}
(無前言)
{/hasIntroduction}
```

### 範本範例

**00_目錄_範本.docx**:
```
目錄

{#chapters}
{romanNumber}、{title}
  {#sections}
  {index}、{name}...........................{page}
  {/sections}

{/chapters}
```

---

## 🚀 **Step 2: API 使用**

### 生成文檔 API

**Endpoint**: `POST /generate-document`

**參數**:
- `template` (file): 範本 DOCX 文件
- `data` (JSON string): 要填充的數據
- `supabase_url` (optional): Supabase URL
- `supabase_key` (optional): Supabase Key

**範例（curl）**:

```bash
curl -X POST http://localhost:8007/generate-document \
  -F "template=@00_目錄_範本.docx" \
  -F 'data={
    "chapters": [
      {
        "romanNumber": "壹",
        "title": "企劃書之可行性及完整性",
        "sections": [
          {"index": "一", "name": "專案緣起", "page": "1-1"},
          {"index": "二", "name": "計畫期程", "page": "1-2"}
        ]
      },
      {
        "romanNumber": "貳",
        "title": "資訊安全",
        "sections": [
          {"index": "一", "name": "資安管理規劃", "page": "2-1"}
        ]
      }
    ]
  }' \
  -o generated.docx
```

**範例（JavaScript）**:

```javascript
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('template', fs.createReadStream('template.docx'));
form.append('data', JSON.stringify({
  chapters: [
    {
      romanNumber: "壹",
      title: "企劃書之可行性及完整性",
      sections: [
        { index: "一", name: "專案緣起", page: "1-1" }
      ]
    }
  ]
}));

const response = await fetch('http://localhost:8007/generate-document', {
  method: 'POST',
  body: form
});

const buffer = await response.buffer();
fs.writeFileSync('output.docx', buffer);
```

---

## 🔄 **Step 3: n8n 工作流整合**

### 工作流結構

```
┌────────────┐     ┌────────────┐     ┌──────────────┐     ┌─────────────┐
│  AI 生成   │────▶│  格式化    │────▶│  範本生成    │────▶│  上傳/返回  │
│  內容      │     │  數據      │     │  服務        │     │  文檔       │
└────────────┘     └────────────┘     └──────────────┘     └─────────────┘
```

### n8n 節點配置

**1. AI 生成內容節點（OpenAI/Claude）**

Prompt 範例：
```
請生成一份服務建議書的目錄，包含以下章節：
1. 企劃書之可行性及完整性
2. 資訊安全
3. 專案管理規劃

每個章節包含 3-5 個小節，格式為 JSON：
{
  "chapters": [
    {
      "romanNumber": "壹",
      "title": "章節名稱",
      "sections": [
        {"index": "一", "name": "小節名稱", "page": "1-1"}
      ]
    }
  ]
}
```

**2. 格式化數據節點（Function）**

```javascript
// 將 AI 生成的內容格式化為範本所需結構
const aiContent = $json.choices[0].message.content;
const data = JSON.parse(aiContent);

// 確保數據結構正確
return {
  json: {
    templateData: data
  }
};
```

**3. HTTP Request 節點（呼叫範本服務）**

- **Method**: POST
- **URL**: `http://5.78.118.41:8007/generate-document`
- **Body**: Multipart-Form
  - `template`: 從 Supabase 或本地讀取範本文件
  - `data`: `{{JSON.stringify($json.templateData)}}`
  - `supabase_url`: `{{$env.NEXT_PUBLIC_SUPABASE_URL}}`
  - `supabase_key`: `{{$env.NEXT_PUBLIC_SUPABASE_ANON_KEY}}`

**4. 處理響應節點**

```javascript
// 解析生成的文檔 URL
const response = $json;

return {
  json: {
    documentUrl: response.url,
    filename: response.filename,
    success: true
  }
};
```

---

## 🎨 **進階功能**

### 插入圖片

範本中使用：
```
{%image}
```

API 數據：
```javascript
{
  image: "base64_encoded_image_data"
}
```

需要安裝額外模組：
```bash
npm install docxtemplater-image-module-free
```

### 表格生成

範本：
```
| 項目 | 說明 |
|------|------|
{#items}
| {name} | {description} |
{/items}
```

數據：
```javascript
{
  items: [
    { name: "項目1", description: "說明1" },
    { name: "項目2", description: "說明2" }
  ]
}
```

---

## 🧪 **測試範例**

### 測試 1：簡單文字替換

**範本**：
```
親愛的 {name}，

您好！我們很高興通知您...

日期：{date}
```

**數據**：
```json
{
  "name": "張三",
  "date": "2026-01-21"
}
```

**測試**：
```bash
curl -X POST http://localhost:8007/generate-document \
  -F "template=@test_simple.docx" \
  -F 'data={"name":"張三","date":"2026-01-21"}' \
  -o output_simple.docx
```

### 測試 2：迴圈列表

**範本**：
```
採購清單：

{#products}
{index}. {name} - ${price}
{/products}

總計：${total}
```

**數據**：
```json
{
  "products": [
    {"index": 1, "name": "筆記本", "price": 50},
    {"index": 2, "name": "原子筆", "price": 10}
  ],
  "total": 60
}
```

---

## 🔧 **維護與監控**

### 查看日誌

```bash
# Docker
docker logs -f template-generation-service

# 本地
npm start
```

### 健康檢查

```bash
curl http://localhost:8007/health
```

預期響應：
```json
{
  "status": "healthy",
  "service": "template-generation-service v1.0",
  "engine": "docxtemplater"
}
```

---

## 📚 **docxtemplater 語法參考**

### 變數
```
{變數名}
```

### 迴圈
```
{#陣列名}
  {項目屬性}
{/陣列名}
```

### 條件
```
{#布林值}
  顯示內容
{/布林值}

{^布林值}
  否則顯示內容
{/布林值}
```

### 原始 HTML
```
{@html變數}
```

---

## ⚠️ **注意事項**

1. **範本文件格式**
   - 必須是 `.docx` 格式
   - 不支援 `.doc` (舊格式)

2. **佔位符命名**
   - 不能包含空格
   - 使用英文、數字、底線
   - 例如：`{user_name}` ✅, `{user name}` ❌

3. **資料結構**
   - 必須是有效的 JSON
   - 迴圈數據必須是陣列
   - 條件數據必須是布林值

4. **文件大小**
   - 範本文件建議 < 10MB
   - 生成的文檔會略大於範本

---

## 🆚 **對比其他方案**

| 方案 | 格式保留 | 易用性 | 頁首頁尾 | 推薦度 |
|------|---------|--------|---------|--------|
| **docxtemplater** | ✅ 100% | ⭐⭐⭐⭐⭐ | ✅ | 🏆 最推薦 |
| officeParser + docx | ⚠️ 需手動映射 | ⭐⭐⭐ | ⚠️ | 不推薦 |
| python-docx | ✅ 100% | ⭐⭐⭐ | ✅ | 複雜 |
| ONLYOFFICE Builder | ❌ 95% | ⭐⭐ | ❌ | 不適合 |

---

## 📖 **更多資源**

- [docxtemplater 官方文檔](https://docxtemplater.com/docs/)
- [範例範本下載](https://docxtemplater.com/demo/)
- [常見問題](https://docxtemplater.com/faq/)

---

## 🎯 **下一步**

1. ✅ 創建範本文件（加入佔位符）
2. ✅ 測試本地服務
3. ⏳ 部署到伺服器（5.78.118.41:8007）
4. ⏳ 建立 n8n 工作流
5. ⏳ 整合 AI 生成內容

**準備好了嗎？要不要現在就測試一下？**

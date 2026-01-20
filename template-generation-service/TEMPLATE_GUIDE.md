# 📝 範本準備指南

如何將現有的 Word 文檔改造為 docxtemplater 範本。

---

## 🎯 **改造原則**

保留所有格式 + 加入佔位符 = 完美範本

---

## 📖 **Step 1: 識別動態內容**

### 原始目錄（00_目錄.docx）

```
目錄

壹、企劃書之可行性及完整性
一、專案緣起.…………………………………………1-1
二、計畫期程.…………………………………………1-2

貳、資訊安全
一、資安管理規劃.……………………………………2-1
```

### 標記動態部分

需要 AI 生成/替換的內容：
- ✏️ **章節名稱**：企劃書之可行性及完整性、資訊安全
- ✏️ **小節名稱**：專案緣起、計畫期程、資安管理規劃
- ✏️ **頁碼**：1-1, 1-2, 2-1
- ✅ **固定內容**：壹、貳、一、二（編號）、點點點（引導線）

---

## 📖 **Step 2: 加入佔位符**

### 方案 A：完全動態（推薦）

適合：AI 生成所有內容

```
目錄

{#chapters}
{romanNumber}、{title}
{#sections}
{sectionNumber}、{name}...{page}
{/sections}

{/chapters}
```

**數據結構**：
```json
{
  "chapters": [
    {
      "romanNumber": "壹",
      "title": "企劃書之可行性及完整性",
      "sections": [
        { "sectionNumber": "一", "name": "專案緣起", "page": "1-1" },
        { "sectionNumber": "二", "name": "計畫期程", "page": "1-2" }
      ]
    },
    {
      "romanNumber": "貳",
      "title": "資訊安全",
      "sections": [
        { "sectionNumber": "一", "name": "資安管理規劃", "page": "2-1" }
      ]
    }
  ]
}
```

### 方案 B：部分動態

適合：章節結構固定，只有內容變化

```
目錄

壹、{chapter1_title}
一、{section1_1_name}...{section1_1_page}
二、{section1_2_name}...{section1_2_page}

貳、{chapter2_title}
一、{section2_1_name}...{section2_1_page}
```

**數據結構**：
```json
{
  "chapter1_title": "企劃書之可行性及完整性",
  "section1_1_name": "專案緣起",
  "section1_1_page": "1-1",
  "section1_2_name": "計畫期程",
  "section1_2_page": "1-2",
  "chapter2_title": "資訊安全",
  "section2_1_name": "資安管理規劃",
  "section2_1_page": "2-1"
}
```

---

## 📖 **Step 3: 在 Word 中編輯**

### 操作步驟

1. **開啟原始範本**
   ```
   00_目錄.docx
   ```

2. **選中要替換的文字**
   ```
   選中：企劃書之可行性及完整性
   ```

3. **輸入佔位符**
   ```
   刪除選中的文字
   輸入：{title}
   ```

4. **保持格式不變**
   - ✅ 佔位符會繼承原文字的格式
   - ✅ 字體、大小、顏色、對齊都保留

5. **另存為範本**
   ```
   00_目錄_範本.docx
   ```

### 視覺對比

**原始**：
```
壹、企劃書之可行性及完整性  (標楷體 14pt 粗體)
```

**改造後**：
```
壹、{title}  (標楷體 14pt 粗體) ← 格式完全保留
```

---

## 🎨 **Step 4: 處理複雜格式**

### 表格範本

**原始表格**：
```
| 項目     | 說明     |
|----------|----------|
| 專案名稱 | XXX系統  |
| 執行期間 | 6個月    |
```

**範本表格**：
```
| 項目     | 說明              |
|----------|-------------------|
| 專案名稱 | {project_name}    |
| 執行期間 | {duration}        |
```

### 多段落內容

**原始**：
```
一、專案緣起

本專案旨在建立...（多段內容）

執行期間為...
```

**範本（保留段落格式）**：
```
一、{section_title}

{section_content}

執行期間為{duration}
```

### 條件內容

**範例：有/無附錄**

```
{#hasAppendix}
陸、附錄
{#appendix_items}
{index}、{name}...{page}
{/appendix_items}
{/hasAppendix}
```

---

## 🔧 **Step 5: 測試範本**

### 快速測試命令

```bash
cd template-generation-service
npm install
node test-local.js
```

### 檢查清單

- [ ] 佔位符語法正確（無空格、無特殊字元）
- [ ] 迴圈標籤配對（{#xxx} ... {/xxx}）
- [ ] 格式保留（字體、顏色、對齊）
- [ ] 生成的文檔可以正常開啟
- [ ] 內容填充正確

---

## ⚠️ **常見錯誤**

### 1. 佔位符命名錯誤

❌ **錯誤**：
```
{章節標題}  ← 不能用中文
{user name}  ← 不能有空格
{user-name}  ← 不建議用連字符
```

✅ **正確**：
```
{title}
{user_name}
{userName}
```

### 2. 迴圈標籤不配對

❌ **錯誤**：
```
{#items}
  {name}
{/item}  ← 名稱不一致
```

✅ **正確**：
```
{#items}
  {name}
{/items}
```

### 3. 資料結構不匹配

**範本**：
```
{#chapters}
  {title}
{/chapters}
```

❌ **錯誤資料**：
```json
{
  "chapters": "第一章"  ← 不是陣列
}
```

✅ **正確資料**：
```json
{
  "chapters": [
    { "title": "第一章" }
  ]
}
```

---

## 📚 **範本範例庫**

### 目錄範本

**檔案**：`templates/00_目錄_範本.docx`

**佔位符**：
```
{#chapters}
{romanNumber}、{title}
{#sections}
{index}、{name}...{page}
{/sections}
{/chapters}
```

### 章節內容範本

**檔案**：`templates/01_章節內容_範本.docx`

**佔位符**：
```
{chapter_number}、{chapter_title}

{#sections}
{section_number}、{section_title}

{content}

{/sections}
```

### 表格範本

**檔案**：`templates/表格_範本.docx`

**佔位符**：
```
{table_title}

{#rows}
| {col1} | {col2} | {col3} |
{/rows}
```

---

## 🎯 **範本改造優先順序**

### 第一階段：目錄
- ✅ 00_目錄.docx → 00_目錄_範本.docx

### 第二階段：主要章節
- ⏳ 01_壹、企劃書.docx → 範本化
- ⏳ 02_貳、資訊安全.docx → 範本化
- ⏳ 03_參、專案管理.docx → 範本化

### 第三階段：附錄
- ⏳ 06_陸、附錄.docx → 範本化

---

## 💡 **進階技巧**

### 1. 預設值

```
{name || "未命名"}
```

### 2. 數字格式化

```
總價：${price}元
```

數據：`{ price: 1000 }` → 顯示：`總價：$1000元`

### 3. 日期格式

需要在數據中先格式化：
```javascript
{
  date: new Date().toLocaleDateString('zh-TW')
}
```

### 4. 換行

使用 `\n` 或啟用 `linebreaks` 選項：
```
{address}
```

數據：
```javascript
{
  address: "台北市\n信義區\n市府路1號"
}
```

---

## 📞 **需要協助？**

如果在範本改造過程中遇到問題：

1. 檢查 docxtemplater 錯誤訊息
2. 使用測試腳本驗證
3. 參考官方範例：https://docxtemplater.com/demo/
4. 查看錯誤日誌

---

**準備好開始改造你的第一個範本了嗎？** 🚀

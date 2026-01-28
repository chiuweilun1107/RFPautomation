# 範本語義標記系統使用指南

## 🎯 功能概述

語義標記系統讓您能夠為範本中的每個段落標記其語義角色（如「主標題」、「內文」等），以便 AI 生成內容時能夠套用對應的格式。

---

## 📋 使用流程

### 1. 上傳範本文件

1. 前往範本庫頁面：`/dashboard/templates`
2. 上傳 .docx 文件
3. 系統會自動跳轉到範本設計器

### 2. 開啟語義標記面板

在範本設計器頁面（`/dashboard/templates/:id/design`）：

1. 點擊頂部的「**語義標記**」按鈕（帶有標籤圖示 🏷️）
2. 右側會滑出語義標記面板

### 3. 標記段落

在語義標記面板中：

1. **查看段落列表**：所有段落以手風琴方式展示
2. **選擇段落**：點擊任一段落展開編輯區
3. **設定語義角色**：
   - **語義角色**：從下拉選單選擇（heading1、content 等）
   - **顯示標籤**：為此段落命名（例如：「專案標題」）
   - **AI 佔位符**（選填）：設定 AI 填充變數（例如：`{project_title}`）
   - **描述說明**（選填）：說明此段落的用途
4. **套用標記**：點擊「添加標記」或「更新標記」按鈕

### 4. 儲存標記

1. 標記完成後，點擊面板頂部的「**儲存**」按鈕
2. 系統會將語義標記儲存到資料庫

---

## 🏷️ 可用的語義角色

| 角色 | 圖示 | 說明 | 用途 |
|------|------|------|------|
| **heading1** | 📌 | 主標題 | 文檔的最主要標題（H1） |
| **heading2** | 📍 | 次標題 | 章節的次要標題（H2） |
| **heading3** | 📎 | 三級標題 | 小節的標題（H3） |
| **content** | 📄 | 一般內文 | 標準段落文字 |
| **list** | 📋 | 列表項目 | 清單或列舉項目 |
| **quote** | 💬 | 引用文字 | 引用或參考內容 |
| **caption** | 🖼️ | 圖說/表格標題 | 圖片或表格的說明文字 |
| **emphasis** | ⭐ | 強調文字 | 需要突出顯示的內容 |
| **note** | 📝 | 備註說明 | 附加說明或注意事項 |
| **footer** | ⬇️ | 頁尾文字 | 頁面底部的資訊 |
| **custom** | 🔧 | 自訂角色 | 使用者自定義的特殊角色 |

---

## 💡 使用範例

### 範例：標書範本

假設您上傳了一個標書範本，包含以下段落：

1. **段落 #1**：「專案名稱」
   - 語義角色：`heading1`
   - 標籤：「專案名稱」
   - AI 佔位符：`{project_name}`

2. **段落 #2**：「本專案旨在...」
   - 語義角色：`content`
   - 標籤：「專案背景」
   - AI 佔位符：`{project_background}`

3. **段落 #3**：「執行策略」
   - 語義角色：`heading2`
   - 標籤：「執行策略標題」

4. **段落 #4**：「我們將採用...」
   - 語義角色：`content`
   - 標籤：「策略說明」
   - AI 佔位符：`{strategy_description}`

### AI 生成時的應用

當 AI 生成內容時，系統會：

1. 識別語義角色為 `heading1` 的段落，套用「主標題」格式
2. 識別 AI 佔位符 `{project_name}`，填入「智慧城市建設專案」
3. 識別語義角色為 `content` 的段落，套用「一般內文」格式
4. 根據標記的結構，保持整體排版一致

---

## 🔧 技術實現

### 資料庫結構

```sql
-- templates 表格新增欄位
ALTER TABLE templates
ADD COLUMN semantic_mappings JSONB DEFAULT '[]';
```

### 資料格式

```json
{
  "semantic_mappings": [
    {
      "id": "mapping-0-1234567890",
      "paragraph_index": 0,
      "semantic_role": "heading1",
      "label": "專案標題",
      "ai_placeholder": "{project_title}",
      "description": "專案的主要標題",
      "is_required": true
    }
  ]
}
```

---

## 🚀 下一步：AI 生成整合

目前語義標記已儲存到資料庫，接下來需要：

1. **修改 AI 生成工作流**（n8n WF11 或相關工作流）
2. **讀取語義標記**：從範本中讀取 `semantic_mappings`
3. **套用格式**：根據 `semantic_role` 套用對應的格式
4. **填充內容**：將 AI 生成的內容填入 `ai_placeholder` 指定的位置

### 整合範例（偽代碼）

```javascript
// 1. 讀取範本的語義標記
const template = await getTemplate(templateId)
const semanticMappings = template.semantic_mappings

// 2. AI 生成內容
const aiContent = {
  project_title: "智慧城市建設專案",
  project_background: "本專案旨在建設智慧城市...",
  strategy_description: "我們將採用分階段實施策略..."
}

// 3. 根據語義標記套用格式
for (const mapping of semanticMappings) {
  const role = mapping.semantic_role
  const placeholder = mapping.ai_placeholder
  const content = aiContent[placeholder.replace(/[{}]/g, '')]

  // 套用對應格式
  applyFormat(role, content)
}
```

---

## 📝 注意事項

1. **段落索引**：語義標記基於段落索引，如果編輯文檔後段落順序改變，需重新標記
2. **儲存時機**：每次編輯標記後記得點擊「儲存」按鈕
3. **OnlyOffice 編輯**：在 OnlyOffice 中編輯文檔後，需要重新整理頁面以更新段落列表

---

## 🐛 故障排除

### 問題：看不到段落列表

**原因**：範本的 `paragraphs` 欄位為空

**解決方案**：
1. 在 OnlyOffice 編輯器中編輯文檔
2. 儲存文檔（Ctrl+S）
3. 刷新頁面

### 問題：儲存後標記消失

**原因**：資料庫遷移未執行

**解決方案**：
```bash
cd backend
supabase db push
```

---

## 📚 相關文件

- **Migration 文件**：`backend/supabase/migrations/20260127000000_add_semantic_mappings.sql`
- **類型定義**：`frontend/src/types/template.ts`
- **面板組件**：`frontend/src/components/templates/SemanticMarkingPanel.tsx`
- **設計器組件**：`frontend/src/components/templates/TemplateDesigner.tsx`

---

🎉 語義標記系統已完成！現在您可以為範本段落標記語義角色，為 AI 生成打下基礎。

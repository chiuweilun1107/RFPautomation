# 📝 範本設計指南

## 如何在 OnlyOffice 中設計範本

### 🎯 標記語法

範本使用 `docxtemplater` 語法，透過 `{}` 標記來填充資料。

### 📋 基本範本結構

在 OnlyOffice 中創建文檔時，使用以下格式：

```
{#chapters}
{title}

  {#sections}
  {title}
  {content}

  {/sections}

{/chapters}
```

### 🎨 格式設定步驟

#### 1. **章節標題 (Chapter Title)**

1. 在文檔中輸入：`{title}`（在 `{#chapters}` 區塊內的第一個）
2. 選中這段文字
3. 設定你想要的格式：
   - 字體：例如 Microsoft YaHei
   - 大小：例如 18pt
   - 粗體、顏色等
4. 這個格式會自動套用到所有章節標題

#### 2. **小節標題 (Section Title)**

1. 在 `{#sections}` 區塊內輸入：`{title}`
2. 選中這段文字
3. 設定格式：
   - 字體：例如 Microsoft YaHei
   - 大小：例如 14pt
   - 粗體等

#### 3. **內容 (Content)**

1. 在小節標題下方輸入：`{content}`
2. 選中這段文字
3. 設定格式：
   - 字體：例如 Microsoft YaHei
   - 大小：例如 12pt
   - 行距等

### 📄 完整範例

```
企劃書範本
====================

{#chapters}
{title}
━━━━━━━━━━━━━━━━━━

  {#sections}
  ▸ {title}

  {content}

  {/sections}

{/chapters}

──────────────────
© 2024 Your Company
```

### 🔧 格式說明

| 標記 | 說明 | 範例 |
|------|------|------|
| `{#chapters}...{/chapters}` | 章節循環 | 會重複產生每個章節 |
| `{#sections}...{/sections}` | 小節循環 | 會重複產生每個小節 |
| `{title}` | 標題 | 自動填入章節/小節標題 |
| `{content}` | 內容 | 自動填入小節內容 |

### ⚠️ 注意事項

1. **循環標記必須成對**：
   - `{#chapters}` 必須有對應的 `{/chapters}`
   - `{#sections}` 必須有對應的 `{/sections}`

2. **縮排很重要**：
   - Sections 應該在 Chapters 內部
   - 保持正確的嵌套結構

3. **格式保留**：
   - 你設定的字體、大小、顏色、粗體等格式
   - 都會保留在最終生成的文檔中

4. **空白行**：
   - 標記之間的空白行也會保留
   - 可以用空白行控制排版

### 🎯 實際填充範例

#### 輸入資料：
```json
{
  "chapters": [
    {
      "title": "專案背景",
      "sections": [
        {
          "title": "市場分析",
          "content": "根據市場調查..."
        },
        {
          "title": "競爭對手",
          "content": "主要競爭對手包括..."
        }
      ]
    },
    {
      "title": "執行計畫",
      "sections": [
        {
          "title": "時程規劃",
          "content": "預計執行時間為..."
        }
      ]
    }
  ]
}
```

#### 輸出結果：
```
企劃書範本
====================

專案背景
━━━━━━━━━━━━━━━━━━

  ▸ 市場分析

  根據市場調查...

  ▸ 競爭對手

  主要競爭對手包括...


執行計畫
━━━━━━━━━━━━━━━━━━

  ▸ 時程規劃

  預計執行時間為...


──────────────────
© 2024 Your Company
```

### 📌 測試你的範本

1. 在 OnlyOffice 中設計好範本
2. 上傳到系統
3. 在 Planning 頁面選擇範本
4. 點擊「預覽」按鈕
5. 查看生成的文檔是否符合預期

### 🆘 常見問題

**Q: 為什麼預覽時格式跑掉了？**
A: 確認標記語法正確，特別是循環標記是否成對。

**Q: 可以使用其他變數嗎？**
A: 目前系統只支援 `chapters`, `title`, `sections`, `content` 這些變數。

**Q: 可以加入圖片嗎？**
A: 可以在範本中預先插入圖片，但無法動態替換。

**Q: 支援表格嗎？**
A: 支援，可以在範本中設計表格格式。

### 📚 更多資源

- [docxtemplater 官方文檔](https://docxtemplater.com/docs/get-started/)
- [OnlyOffice 使用指南](https://helpcenter.onlyoffice.com/)

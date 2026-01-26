# ONLYOFFICE 標楷體字體解決方案

## 問題說明

ONLYOFFICE 的字體替換機制是在**應用程式層級**處理的，不依賴系統的 fontconfig。因此即使設定了 fontconfig 別名，當用戶上傳包含「標楷體」字體的 Word 文件時，ONLYOFFICE 仍無法正確渲染為楷體風格。

## 解決方案

在文件上傳時**預處理 .docx 文件**，直接修改文件內部的字體引用，將「標楷體」等字體名稱替換為 ONLYOFFICE 可識別的「AR PL KaitiM Big5」。

## 實作架構

### 1. Python 字體替換腳本

**文件:** `scripts/replace-font-in-docx.py`

- 解壓 .docx 文件（實際上是 ZIP 格式）
- 解析 XML 文件（document.xml, styles.xml, numbering.xml）
- 替換所有 `<w:rFonts>` 元素中的字體引用
- 重新打包為 .docx

**支援的字體映射:**
- `標楷體` → `AR PL KaitiM Big5`
- `DFKai-SB` → `AR PL KaitiM Big5`
- `KaiTi` → `AR PL KaitiM Big5`
- `楷体` → `AR PL KaitiM Big5`
- `BiauKai` → `AR PL KaitiM Big5`

### 2. Node.js/TypeScript 包裝器

**文件:** `scripts/process-docx-fonts.ts`

- 提供 TypeScript 接口調用 Python 腳本
- 可獨立執行或被其他模組導入

**使用方式:**
```bash
npx tsx scripts/process-docx-fonts.ts input.docx [output.docx]
```

### 3. API Route

**文件:** `src/app/api/process-and-upload/route.ts`

**流程:**
1. 接收上傳的 .docx 文件
2. 儲存到臨時文件
3. 執行 Python 腳本替換字體
4. 上傳處理後的文件到 Supabase Storage
5. 返回公開 URL

**API 端點:**
```
POST /api/process-and-upload
Content-Type: multipart/form-data

Body:
  file: <.docx 文件>

Response:
{
  "success": true,
  "url": "https://...",
  "fileName": "原始文件名.docx",
  "processedPath": "test-uploads/1234567890.docx"
}
```

### 4. 測試頁面

**文件:** `src/app/test-onlyoffice-upload-v3/page.tsx`

**訪問:** http://localhost:3000/test-onlyoffice-upload-v3

**功能:**
- 文件上傳界面
- 自動調用字體處理 API
- ONLYOFFICE 編輯器整合
- 錯誤處理和狀態顯示

## 測試步驟

### 1. 啟動開發伺服器

```bash
cd frontend
npm run dev
```

### 2. 訪問測試頁面

http://localhost:3000/test-onlyoffice-upload-v3

### 3. 上傳測試文件

- 選擇包含「標楷體」字體的 .docx 文件（例如 `00_目錄.docx`）
- 等待處理和上傳
- 文件應在 ONLYOFFICE 中正確顯示為楷體風格

### 4. 驗證結果

- ✅ 所有中文字都應顯示為楷體（有毛筆筆觸）
- ✅ 不應只有「壹貳參」等少數字顯示為楷體
- ✅ 字體下拉選單可能顯示「標楷體」或「AR PL KaitiM Big5」

## 獨立測試腳本

如果要單獨測試字體替換功能：

```bash
# 使用 Python 直接處理
python3 scripts/replace-font-in-docx.py input.docx output.docx

# 或使用 TypeScript 包裝器
npx tsx scripts/process-docx-fonts.ts input.docx output.docx
```

處理後的文件會替換所有「標楷體」引用為「AR PL KaitiM Big5」。

## 技術細節

### DOCX 文件結構

.docx 文件實際上是包含 XML 文件的 ZIP 壓縮檔：

```
document.docx
├── [Content_Types].xml
├── _rels/
├── word/
│   ├── document.xml      ← 主文檔內容
│   ├── styles.xml        ← 樣式定義
│   ├── numbering.xml     ← 編號樣式
│   ├── fontTable.xml
│   └── ...
└── docProps/
```

### 字體引用格式

XML 中的字體引用：

```xml
<w:rPr>
  <w:rFonts w:ascii="標楷體"
            w:hAnsi="標楷體"
            w:eastAsia="標楷體"
            w:cs="標楷體"/>
</w:rPr>
```

腳本會將所有屬性值從「標楷體」替換為「AR PL KaitiM Big5」。

## 環境需求

### Python
- Python 3.x
- 標準庫（無需額外安裝套件）

### Node.js
- Node.js 18+
- TypeScript

### Supabase
需要設定環境變數：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 整合到專案

要將此功能整合到實際專案中：

1. **在上傳流程中調用 API:**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/process-and-upload', {
  method: 'POST',
  body: formData,
});

const { url, fileName } = await response.json();
```

2. **使用返回的 URL 初始化 ONLYOFFICE:**
```typescript
new window.DocsAPI.DocEditor('editor', {
  document: {
    url: url,
    title: fileName,
    // ...
  },
  // ...
});
```

## 已知限制

1. **處理時間:** 大文件可能需要幾秒鐘處理
2. **臨時文件:** API route 會在處理過程中建立臨時文件
3. **字體名稱:** 只處理預定義的字體映射列表
4. **嵌入字體:** 不處理嵌入在文件中的字體

## 故障排除

### Python 腳本執行失敗

檢查 Python 是否正確安裝：
```bash
python3 --version
```

### API 返回 500 錯誤

檢查伺服器日誌，常見原因：
- Python 腳本路徑錯誤
- 臨時目錄權限問題
- Supabase 認證失敗

### 字體仍未正確顯示

1. 確認 ONLYOFFICE 伺服器已安裝完整的 AR PL KaitiM Big5 字體
2. 檢查處理後的文件是否確實替換了字體
3. 清除瀏覽器緩存並重新上傳

## 參考資料

- [ONLYOFFICE Font Configuration](https://helpcenter.onlyoffice.com/docs/installation/docs-community-install-fonts-linux.aspx)
- [Office Open XML - Fonts](http://officeopenxml.com/WPfonts.php)
- [ONLYOFFICE Core Font Engine Source](https://github.com/ONLYOFFICE/core/tree/master/DesktopEditor/fontengine)

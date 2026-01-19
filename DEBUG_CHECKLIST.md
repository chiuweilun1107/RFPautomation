# Google Drive 整合除錯檢查清單

## 🔍 問題：點擊 GOOGLE DRIVE 按鈕只顯示 "coming soon"

### 可能原因：

1. **開發伺服器未重啟** - 最可能
2. **TypeScript/編譯錯誤**
3. **Hook 未正確匯入**
4. **瀏覽器快取問題**

---

## ✅ 除錯步驟

### 步驟 1：確認開發伺服器已重啟

您修改 `.env.local` 後，**必須完全停止並重啟開發伺服器**。

```bash
# 在開發伺服器終端按 Ctrl+C 完全停止

# 重新啟動
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
npm run dev
```

**檢查啟動 log**：
- ✅ 應該看到：`✓ Compiled successfully`
- ❌ 不應該看到：`TOKEN_ENCRYPTION_KEY must be set` 等錯誤

### 步驟 2：清除瀏覽器快取

1. **硬重新整理**（推薦）：
   - **Mac**: `Cmd + Shift + R`
   - **Windows/Linux**: `Ctrl + Shift + R`

2. **或清除快取**：
   - 開啟開發者工具（F12）
   - 右鍵點擊重新整理按鈕
   - 選擇「清除快取並強制重新整理」

### 步驟 3：檢查瀏覽器 Console 錯誤

1. **開啟開發者工具**：按 `F12` 或 `Cmd+Option+I` (Mac)

2. **切換到 Console 標籤**

3. **點擊 GOOGLE DRIVE 按鈕**

4. **檢查是否有錯誤訊息**：
   - ❌ `useGoogleDrivePicker is not defined`
   - ❌ `openPicker is not a function`
   - ❌ `Cannot read property 'openPicker' of undefined`
   - ❌ 任何紅色錯誤訊息

**請截圖 Console 的錯誤並告訴我**

### 步驟 4：檢查開發伺服器終端

在開發伺服器的終端視窗中，檢查是否有：

```
✓ Compiled /components/knowledge/UploadZone.tsx
✓ Compiled /hooks/useGoogleDrivePicker.ts
```

或任何編譯錯誤：
```
× Failed to compile
```

---

## 🧪 快速測試

### 測試 1：檢查 Hook 是否載入

在瀏覽器 Console 中執行：

```javascript
// 開啟 F12 Console，貼上並執行
console.log('Testing Google Drive Hook')
```

然後點擊 GOOGLE DRIVE 按鈕，觀察是否有任何 log 輸出。

### 測試 2：檢查按鈕 onClick 事件

檢查按鈕是否真的觸發了 `openPicker()` 而不是顯示 "coming soon"。

---

## 🔧 可能的解決方案

### 方案 1：完全重啟（最常見）

```bash
# 1. 停止開發伺服器（Ctrl+C）
# 2. 清除 Next.js 快取
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
rm -rf .next

# 3. 重新啟動
npm run dev
```

### 方案 2：檢查 Hook 匯入

確認 `/frontend/src/hooks/useGoogleDrivePicker.ts` 檔案存在：

```bash
ls -la /Users/chiuyongren/Desktop/AI\ dev/frontend/src/hooks/useGoogleDrivePicker.ts
```

應該顯示檔案存在。

### 方案 3：檢查環境變數

在開發伺服器終端執行（新開一個終端）：

```bash
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
node -e "require('dotenv').config({ path: '.env.local' }); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set');"
```

應該顯示：`GOOGLE_CLIENT_ID: ✓ Set`

---

## 📸 需要您提供的資訊

請提供以下截圖/資訊，我才能精確診斷問題：

1. **開發伺服器終端輸出**
   - 啟動時的 log
   - 是否有編譯錯誤

2. **瀏覽器 Console**（F12）
   - 點擊 GOOGLE DRIVE 按鈕後的錯誤訊息
   - 任何紅色錯誤

3. **Network 標籤**（F12 → Network）
   - 點擊按鈕後是否有 API 請求
   - 請求是否失敗

---

## 🎯 預期行為

正確的流程應該是：

1. **點擊 GOOGLE DRIVE 按鈕**
2. **如果是第一次**：
   - 彈出 Google OAuth 授權視窗
   - 選擇帳號並授權
3. **如果已授權**：
   - 直接開啟 Google Picker（檔案選擇器）
4. **選擇檔案並匯入**

**絕對不應該顯示** "coming soon" 訊息！

---

請先執行「步驟 1：確認開發伺服器已重啟」，然後告訴我結果！

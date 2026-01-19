# Google Drive 整合設定指南

## ✅ 已完成的實作

### 資料庫
- [x] 建立 `google_oauth_tokens` 表（已執行 migration）
- [x] 建立 `oauth_states` 表（CSRF 保護）
- [x] 擴充 `source_type` 支援 `google_drive`

### 後端 API
- [x] `/api/auth/google/generate-state` - OAuth State 生成
- [x] `/api/auth/google/callback` - OAuth 回調處理
- [x] `/api/auth/google/refresh` - Token 自動刷新
- [x] `/api/sources/from-drive` - Google Drive 檔案匯入
- [x] `crypto.ts` - AES-256-GCM 加密工具

### 前端整合
- [x] `useGoogleDrivePicker` Hook - Google Drive 選擇器
- [x] `UploadZone` 組件 - 整合 Google Drive 按鈕

---

## 🔧 需要完成的設定步驟

### 1. 生成加密金鑰

執行以下命令生成 `TOKEN_ENCRYPTION_KEY`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

將生成的金鑰加入 `.env.local`：

```bash
TOKEN_ENCRYPTION_KEY=<生成的64字元hex字串>
```

### 2. Google Cloud Console 設定

#### 2.1 建立專案（如果沒有）
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案

#### 2.2 啟用 Google Drive API
1. 前往 **APIs & Services > Library**
2. 搜尋 "Google Drive API"
3. 點擊 **Enable**

#### 2.3 建立 OAuth 2.0 憑證
1. 前往 **APIs & Services > Credentials**
2. 點擊 **Create Credentials > OAuth client ID**
3. 選擇 **Web application**
4. 設定：
   - **Name**: RFP Automation - Google Drive
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`（開發環境）
     - `https://your-production-domain.com`（生產環境）
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://your-production-domain.com/api/auth/google/callback`
5. 點擊 **Create**
6. 複製 **Client ID** 和 **Client Secret**

#### 2.4 設定 OAuth 同意畫面
1. 前往 **APIs & Services > OAuth consent screen**
2. 選擇 **External**（或 **Internal** 如果是 Google Workspace）
3. 填寫應用程式資訊：
   - **App name**: RFP Automation System
   - **User support email**: 您的 email
   - **Developer contact information**: 您的 email
4. 在 **Scopes** 頁面，加入：
   - `https://www.googleapis.com/auth/drive.readonly`
5. 儲存並繼續

### 3. 環境變數設定

將以下變數加入 `frontend/.env.local`：

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Token Encryption (from step 1)
TOKEN_ENCRYPTION_KEY=<64 hex characters>
```

**生產環境**記得修改 `GOOGLE_REDIRECT_URI`：
```bash
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

---

## 🧪 測試步驟

### 1. 啟動開發伺服器

```bash
cd frontend
npm run dev
```

### 2. 測試 OAuth 流程

1. 前往 `http://localhost:3000/dashboard/knowledge`
2. 點擊上傳區域中的 **GOOGLE DRIVE** 按鈕
3. 應該會開啟 Google OAuth 授權視窗
4. 選擇 Google 帳戶並授權
5. 授權成功後應該會：
   - 關閉彈出視窗
   - 顯示成功訊息
   - Token 已儲存到資料庫

### 3. 測試檔案匯入

1. 再次點擊 **GOOGLE DRIVE** 按鈕
2. 這次應該會直接開啟 Google Picker（不需要重新授權）
3. 選擇一個檔案（PDF 或 DOCX）
4. 點擊 **Select**
5. 檔案應該會：
   - 從 Google Drive 下載
   - 上傳到 Supabase Storage
   - 建立 Source 記錄
   - 觸發 n8n 處理工作流
   - 顯示在知識庫列表中

### 4. 驗證資料庫

檢查 tokens 是否正確儲存：

```bash
cd /Users/chiuyongren/Desktop/AI\ dev
PGPASSWORD="9963GhOTa0jZSTi4" psql -h "aws-1-ap-northeast-1.pooler.supabase.com" -p 6543 -U "postgres.goyonrowhfphooryfzif" -d "postgres" -c "SELECT id, user_id, scope, created_at, last_used_at FROM google_oauth_tokens;"
```

檢查匯入的 sources：

```bash
PGPASSWORD="9963GhOTa0jZSTi4" psql -h "aws-1-ap-northeast-1.pooler.supabase.com" -p 6543 -U "postgres.goyonrowhfphooryfzif" -d "postgres" -c "SELECT id, title, source_type, status, metadata FROM sources WHERE source_type = 'google_drive';"
```

---

## 🔍 除錯指引

### 問題 1: "TOKEN_ENCRYPTION_KEY must be set"

**原因**: 環境變數未設定或格式錯誤

**解決方案**:
```bash
# 生成新金鑰
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 加入 .env.local（必須是 64 個 hex 字元）
TOKEN_ENCRYPTION_KEY=<生成的金鑰>
```

### 問題 2: OAuth 回調失敗 "invalid_state"

**原因**: State token 過期或不匹配

**解決方案**:
1. 檢查系統時間是否正確
2. 清除過期的 state tokens:
```sql
DELETE FROM oauth_states WHERE expires_at < NOW();
```
3. 重新嘗試授權

### 問題 3: "No refresh token received"

**原因**: Google 沒有返回 refresh token

**解決方案**:
1. 撤銷應用程式授權：https://myaccount.google.com/permissions
2. 重新授權（第一次授權必須選擇 "Allow"）
3. 確認 OAuth URL 包含 `access_type=offline&prompt=consent`

### 問題 4: Google Picker 無法開啟

**原因**: Google Picker API 未載入

**解決方案**:
1. 檢查網路連線
2. 檢查瀏覽器 Console 是否有錯誤
3. 確認 Google Client ID 正確設定

### 問題 5: 檔案下載失敗

**原因**: Access token 過期或權限不足

**解決方案**:
1. Token 會自動刷新，稍後重試
2. 檢查是否授權了 `drive.readonly` scope
3. 查看後端 logs:
```bash
# 查看 Next.js logs
cd frontend
npm run dev
```

---

## 📊 系統架構

```
用戶點擊 "GOOGLE DRIVE"
    ↓
前端：useGoogleDrivePicker Hook
    ↓
API: /api/auth/google/generate-state
    ↓
開啟 Google OAuth 授權視窗
    ↓
用戶授權並回調到 /api/auth/google/callback
    ↓
後端：交換 code 取得 tokens
    ↓
後端：加密並儲存 tokens 到 DB
    ↓
前端：開啟 Google Picker
    ↓
用戶選擇檔案
    ↓
前端：呼叫 /api/sources/from-drive
    ↓
後端：使用 access token 下載檔案
    ↓
後端：上傳到 Supabase Storage
    ↓
後端：建立 Source 記錄
    ↓
後端：觸發 n8n 工作流
    ↓
完成！檔案出現在知識庫
```

---

## 🎯 下一步改進建議

1. **批次匯入**: 支援選擇多個檔案
2. **Google Sheets 支援**: 匯出為 CSV 或 Excel
3. **進度顯示**: 大檔案下載進度條
4. **重新連接 UI**: 當 token 失效時的提示
5. **檔案預覽**: 匯入前預覽檔案內容
6. **同步功能**: 定期同步 Google Drive 資料夾

---

## 📝 相關文檔

- [Google Drive API 文檔](https://developers.google.com/drive/api/guides/about-sdk)
- [Google Picker API 文檔](https://developers.google.com/picker/docs)
- [OAuth 2.0 最佳實踐](https://datatracker.ietf.org/doc/html/rfc6749)
- [Supabase Auth 文檔](https://supabase.com/docs/guides/auth)

---

**實作完成時間**: 2026-01-19
**實作者**: Claude Sonnet 4.5 (AI Assistant)
**狀態**: ✅ 代碼實作完成，等待環境變數設定和測試

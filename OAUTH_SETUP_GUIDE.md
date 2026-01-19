# OAuth 2.0 憑證設定指引

## ✅ 已完成的自動化設定

- ✅ Google Cloud 專案：`rfp-automation-20260119`
- ✅ Google Drive API：已啟用
- ✅ Token 加密金鑰：已生成

---

## 🔐 步驟 1：設定 OAuth 同意畫面

請開啟瀏覽器，前往：

```
https://console.cloud.google.com/apis/credentials/consent?project=rfp-automation-20260119
```

### 操作步驟：

1. **選擇使用者類型**
   - 選擇 **"External"**（外部）
   - 點擊 **"CREATE"**

2. **填寫應用程式資訊**
   - **App name**（應用程式名稱）：`RFP Automation System`
   - **User support email**（使用者支援電子郵件）：選擇您的 email
   - **App logo**（選填）：可跳過
   - **Developer contact information**（開發者聯絡資訊）：輸入您的 email
   - 點擊 **"SAVE AND CONTINUE"**

3. **設定 Scopes（權限範圍）**
   - 點擊 **"ADD OR REMOVE SCOPES"**
   - 在搜尋框輸入：`drive.readonly`
   - 勾選：`https://www.googleapis.com/auth/drive.readonly`
     - 說明：查看和下載 Google 雲端硬碟中的所有檔案
   - 點擊 **"UPDATE"**
   - 點擊 **"SAVE AND CONTINUE"**

4. **新增測試使用者（Testing）**
   - 點擊 **"ADD USERS"**
   - 輸入您的 Google Email（用於測試）
   - 點擊 **"ADD"**
   - 點擊 **"SAVE AND CONTINUE"**

5. **摘要頁面**
   - 檢查設定
   - 點擊 **"BACK TO DASHBOARD"**

✅ **完成！OAuth 同意畫面已設定**

---

## 🔑 步驟 2：建立 OAuth 2.0 憑證

請開啟：

```
https://console.cloud.google.com/apis/credentials?project=rfp-automation-20260119
```

### 操作步驟：

1. **建立憑證**
   - 點擊頂部的 **"+ CREATE CREDENTIALS"**
   - 選擇 **"OAuth client ID"**

2. **選擇應用程式類型**
   - Application type（應用程式類型）：選擇 **"Web application"**
   - Name（名稱）：`RFP Automation - Google Drive Integration`

3. **設定授權來源**

   **Authorized JavaScript origins（已授權的 JavaScript 來源）**：
   - 點擊 **"+ ADD URI"**
   - 輸入：`http://localhost:3000`
   - （如果有正式環境，也加入正式網域）

   **Authorized redirect URIs（已授權的重新導向 URI）**：
   - 點擊 **"+ ADD URI"**
   - 輸入：`http://localhost:3000/api/auth/google/callback`
   - （如果有正式環境，也加入：`https://your-domain.com/api/auth/google/callback`）

4. **建立憑證**
   - 點擊 **"CREATE"**
   - 會彈出視窗顯示您的憑證

5. **複製憑證**
   - **Client ID**：形如 `xxxxx.apps.googleusercontent.com`
   - **Client secret**：隨機字串
   - ⚠️ **請將這兩個值先複製到安全的地方**

✅ **完成！OAuth 憑證已建立**

---

## 📝 步驟 3：設定環境變數

請複製您剛才取得的 **Client ID** 和 **Client Secret**，然後告訴我，我會自動設定環境變數。

或者您也可以手動編輯：`frontend/.env.local`

加入以下內容：

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=<您的 Client ID>
GOOGLE_CLIENT_SECRET=<您的 Client Secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Token Encryption Key（已生成）
TOKEN_ENCRYPTION_KEY=ed680e9590e77075d00ed605b299ee11f355171df1db0bc0cc6abadd3f25a473
```

---

## 🚀 步驟 4：測試

1. **啟動開發伺服器**：
   ```bash
   cd /Users/chiuyongren/Desktop/AI\ dev/frontend
   npm run dev
   ```

2. **開啟瀏覽器**：
   ```
   http://localhost:3000/dashboard/knowledge
   ```

3. **測試 Google Drive 整合**：
   - 點擊 **"GOOGLE DRIVE"** 按鈕
   - 應該會開啟 Google OAuth 授權視窗
   - 選擇您的 Google 帳號
   - 授權存取 Google Drive
   - 選擇檔案並匯入

---

## 📊 設定摘要

| 項目 | 狀態 | 值 |
|------|------|-----|
| Google Cloud 專案 | ✅ | rfp-automation-20260119 |
| Drive API | ✅ | 已啟用 |
| OAuth 同意畫面 | ⏳ | 需要手動設定 |
| OAuth 憑證 | ⏳ | 需要手動建立 |
| 加密金鑰 | ✅ | 已生成 |
| 環境變數 | ⏳ | 等待 Client ID/Secret |

---

## 🔧 快速連結

- **OAuth 同意畫面**：https://console.cloud.google.com/apis/credentials/consent?project=rfp-automation-20260119
- **OAuth 憑證**：https://console.cloud.google.com/apis/credentials?project=rfp-automation-20260119
- **API 儀表板**：https://console.cloud.google.com/apis/dashboard?project=rfp-automation-20260119

---

## ⚠️ 重要提醒

1. **測試模式限制**：
   - 在測試模式下，只有新增的「測試使用者」可以使用
   - 最多可新增 100 個測試使用者
   - 如果要公開使用，需要申請 OAuth 驗證（較複雜）

2. **Token 有效期**：
   - Access Token：1 小時
   - Refresh Token：長期有效（除非撤銷）

3. **Redirect URI 必須完全匹配**：
   - 包含 protocol (http/https)
   - 包含 port (如 :3000)
   - 大小寫敏感

---

**下一步**：完成 OAuth 同意畫面和憑證設定後，將 Client ID 和 Secret 告訴我，我會自動設定環境變數！

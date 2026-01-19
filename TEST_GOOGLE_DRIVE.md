# Google Drive 整合測試指南

## ✅ 設定完成確認

- ✅ Google Cloud 專案：`rfp-automation-20260119`
- ✅ Google Drive API：已啟用
- ✅ OAuth 同意畫面：已設定
- ✅ OAuth 憑證：已建立
- ✅ 環境變數：已設定到 `.env.local`
- ✅ 資料庫 Migrations：已執行

---

## 🧪 測試步驟

### 步驟 1：啟動開發伺服器

```bash
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
npm run dev
```

等待伺服器啟動，應該會看到：
```
✓ Ready in XXXms
○ Local:        http://localhost:3000
```

### 步驟 2：開啟知識庫頁面

在瀏覽器中開啟：
```
http://localhost:3000/dashboard/knowledge
```

### 步驟 3：測試 Google Drive 連接

1. **找到上傳區域**
   - 頁面中應該有一個檔案上傳區塊
   - 下方有 4 個按鈕：UPLOAD FILE、WEB URL、GOOGLE DRIVE、PASTE TEXT

2. **點擊 "GOOGLE DRIVE" 按鈕**
   - 應該會開啟 Google OAuth 授權彈出視窗
   - 視窗標題應該是 "選擇帳戶"

3. **選擇 Google 帳號**
   - 選擇您在 OAuth 同意畫面中新增的測試使用者帳號
   - 如果出現警告「這個應用程式未經驗證」，點擊「繼續」（這是正常的，因為應用程式在測試模式）

4. **授權權限**
   - 應該會顯示：「RFP-automation 想要存取您的 Google 雲端硬碟」
   - 權限：「查看和下載 Google 雲端硬碟中的所有檔案」
   - 點擊「允許」

5. **授權成功**
   - 彈出視窗會自動關閉
   - 您應該會回到知識庫頁面
   - 可能會看到成功訊息（如果有實作）

### 步驟 4：測試檔案匯入

1. **再次點擊 "GOOGLE DRIVE" 按鈕**
   - 這次應該**不需要重新授權**
   - 直接開啟 Google Picker（檔案選擇器）

2. **選擇檔案**
   - 瀏覽您的 Google Drive
   - 選擇一個檔案（建議選擇 PDF 或 DOCX）
   - 點擊「選取」

3. **等待匯入**
   - 按鈕應該顯示「IMPORTING...」
   - 檔案會：
     1. 從 Google Drive 下載
     2. 上傳到 Supabase Storage
     3. 建立 Source 記錄
     4. 觸發 n8n 處理工作流

4. **檢查結果**
   - 成功後應該會顯示成功訊息
   - 檔案應該出現在知識庫列表中
   - 狀態應該是「processing」或「ready」

---

## 🔍 驗證資料庫

如果您想確認資料是否正確儲存，可以執行：

```bash
cd /Users/chiuyongren/Desktop/AI\ dev
PGPASSWORD="9963GhOTa0jZSTi4" psql -h "aws-1-ap-northeast-1.pooler.supabase.com" -p 6543 -U "postgres.goyonrowhfphooryfzif" -d "postgres"
```

然後執行：

```sql
-- 檢查 OAuth tokens
SELECT id, user_id, scope, created_at, last_used_at
FROM google_oauth_tokens;

-- 檢查匯入的 sources
SELECT id, title, source_type, type, status, created_at
FROM sources
WHERE source_type = 'google_drive'
ORDER BY created_at DESC
LIMIT 5;

-- 離開
\q
```

---

## 🐛 可能遇到的問題與解決方案

### 問題 1：點擊 GOOGLE DRIVE 按鈕沒反應

**可能原因**：
- 環境變數未正確載入
- 開發伺服器未重啟

**解決方案**：
```bash
# 停止開發伺服器 (Ctrl+C)
# 重新啟動
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
npm run dev
```

### 問題 2：OAuth 彈出視窗被封鎖

**可能原因**：瀏覽器封鎖彈出視窗

**解決方案**：
- 檢查瀏覽器網址列右側是否有「彈出視窗已封鎖」圖示
- 點擊並允許 `localhost:3000` 的彈出視窗

### 問題 3：授權後顯示 "invalid_state" 錯誤

**可能原因**：State token 過期

**解決方案**：
```sql
-- 清除過期的 state tokens
DELETE FROM oauth_states WHERE expires_at < NOW();
```
然後重試授權流程

### 問題 4："No refresh token received"

**可能原因**：
- 您之前已經授權過，Google 不會再次提供 refresh token
- OAuth URL 缺少 `prompt=consent` 參數

**解決方案**：
1. 前往 https://myaccount.google.com/permissions
2. 找到「RFP-automation」並撤銷存取權
3. 重新授權

### 問題 5：Google Picker 無法開啟

**可能原因**：Google Picker API 未載入

**解決方案**：
- 開啟瀏覽器開發者工具（F12）
- 檢查 Console 是否有錯誤訊息
- 確認網路連線正常

### 問題 6：檔案匯入失敗

**可能原因**：
- Access token 過期
- Supabase Storage 權限問題
- n8n webhook 未啟動

**解決方案**：
```bash
# 檢查後端 logs
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
npm run dev
# 觀察 terminal 輸出
```

查看是否有錯誤訊息：
- `Failed to get access token` → Token refresh 失敗
- `Failed to upload to storage` → Supabase Storage 問題
- `Failed to download file` → Google Drive API 問題

---

## 📊 成功指標

✅ **OAuth 流程**：
- 彈出視窗正常開啟
- 可以選擇帳號並授權
- 授權後自動關閉視窗

✅ **Token 管理**：
- 首次授權後，tokens 儲存到資料庫
- 第二次點擊不需要重新授權
- Access token 自動刷新

✅ **檔案匯入**：
- 可以開啟 Google Picker
- 選擇檔案後成功匯入
- 檔案出現在知識庫列表
- n8n 工作流被觸發（檢查 status 變為 'ready'）

---

## 📝 測試檢查清單

- [ ] 開發伺服器啟動成功
- [ ] 可以存取知識庫頁面
- [ ] GOOGLE DRIVE 按鈕可見
- [ ] 點擊後開啟 OAuth 視窗
- [ ] 成功授權 Google 帳號
- [ ] 授權後視窗關閉
- [ ] 再次點擊直接開啟 Picker
- [ ] 可以瀏覽 Google Drive 檔案
- [ ] 選擇檔案並匯入
- [ ] 檔案出現在知識庫列表
- [ ] 資料庫中有對應的 source 記錄
- [ ] source_type 為 'google_drive'

---

## 🎯 下一步

測試成功後，您可以：

1. **新增更多測試使用者**
   - 前往 OAuth 同意畫面
   - 在「測試使用者」中新增更多 email

2. **調整 Redirect URI（正式環境）**
   - 在 OAuth 憑證中新增正式網域的 callback URI
   - 更新 `.env.local` 中的 `GOOGLE_REDIRECT_URI`

3. **申請 OAuth 驗證（選用）**
   - 如果要公開使用，需要提交 OAuth 應用程式驗證
   - 過程較複雜，需要提供隱私政策、使用條款等

4. **監控和優化**
   - 監控 token refresh 失敗率
   - 優化大檔案下載速度
   - 新增進度顯示

---

**準備好開始測試了嗎？**

執行：
```bash
cd /Users/chiuyongren/Desktop/AI\ dev/frontend
npm run dev
```

然後開啟 http://localhost:3000/dashboard/knowledge 🚀

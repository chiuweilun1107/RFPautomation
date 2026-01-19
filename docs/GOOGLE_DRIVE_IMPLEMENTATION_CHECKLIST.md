# Google Drive Integration - Implementation Checklist

**專案**: NotebookLM Knowledge System - Google Drive Integration
**預估完成時間**: 8 個工作天
**負責人**: [待分配]
**日期**: 2026-01-19

---

## 📋 Phase 0: 基礎設施準備 (0.5 天)

### Google Cloud Console 配置
- [ ] 建立或選擇 Google Cloud Project
- [ ] 啟用 Google Drive API
- [ ] 啟用 Google Picker API
- [ ] 建立 OAuth 2.0 憑證（Web Application）
  - [ ] 設定 Authorized JavaScript origins
    - [ ] `http://localhost:3000`
    - [ ] `https://[production-domain]`
  - [ ] 設定 Authorized redirect URIs
    - [ ] `http://localhost:3000/api/auth/google/callback`
    - [ ] `https://[production-domain]/api/auth/google/callback`
- [ ] 取得 Client ID
- [ ] 取得 Client Secret
- [ ] 取得 API Key (for Picker)
- [ ] 測試 OAuth Playground

### 環境變數配置
- [ ] 生成 Token 加密金鑰
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] 更新 `frontend/.env.local`:
  ```bash
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-xxx
  NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=AIzaSy-xxx
  GOOGLE_TOKEN_ENCRYPTION_KEY=<32-byte-hex>
  ```
- [ ] 驗證環境變數載入成功

---

## 🗄️ Phase 1: 後端基礎建設 (2.5 天)

### Task 1.1: 安裝依賴套件
```bash
cd frontend
npm install googleapis @types/googleapis
```
- [ ] 確認安裝成功
- [ ] 更新 `package.json`

### Task 1.2: 資料庫 Schema Migration
**檔案**: `/backend/supabase/migrations/20260119_google_drive_integration.sql`

- [ ] 建立 Migration 檔案
- [ ] 複製 SQL Schema:
  - [ ] `google_tokens` 表
  - [ ] `oauth_states` 表
  - [ ] RLS Policies
  - [ ] Indexes
  - [ ] 更新 `sources` 表（新增 `source_type` 欄位）
- [ ] 在測試環境執行 Migration:
  ```bash
  cd backend
  supabase db push
  ```
- [ ] 驗證資料表建立成功
- [ ] 測試 RLS Policies
- [ ] 在生產環境執行 Migration

### Task 1.3: Token 加密工具
**檔案**: `/frontend/src/lib/crypto.ts`

- [ ] 建立檔案
- [ ] 實作 `encryptToken(token: string): string`
- [ ] 實作 `decryptToken(encryptedData: string): string`
- [ ] 撰寫測試:
  ```bash
  # test-crypto.ts
  node -r ts-node/register test-crypto.ts
  ```
- [ ] 測試通過：加密 → 解密 → 相等

### Task 1.4: CSRF Protection (State Token)
**檔案**: `/frontend/src/app/api/auth/google/generate-state/route.ts`

- [ ] 建立檔案
- [ ] 實作 `GET` handler
- [ ] 生成隨機 state (32 bytes)
- [ ] 存入 `oauth_states` 表
- [ ] 設定 5 分鐘過期
- [ ] 測試端點:
  ```bash
  curl http://localhost:3000/api/auth/google/generate-state \
    -H "Authorization: Bearer <supabase-token>"
  ```
- [ ] 驗證 state 存入資料庫

### Task 1.5: Backend API - Google Callback
**檔案**: `/frontend/src/app/api/auth/google/callback/route.ts`

- [ ] 建立檔案
- [ ] 實作 `POST` handler
- [ ] 驗證 state (CSRF protection)
- [ ] Exchange code for tokens (使用 googleapis)
- [ ] 加密 refresh_token
- [ ] 存入 `google_tokens` 表
- [ ] 刪除已使用的 state
- [ ] 回傳 access_token
- [ ] 錯誤處理:
  - [ ] Invalid state
  - [ ] No refresh_token
  - [ ] Database error
- [ ] 測試端點 (Postman)

### Task 1.6: Backend API - Token Refresh
**檔案**: `/frontend/src/app/api/auth/google/refresh/route.ts`

- [ ] 建立檔案
- [ ] 實作 `POST` handler
- [ ] 從資料庫取得 encrypted_refresh_token
- [ ] 解密 refresh_token
- [ ] 使用 googleapis 刷新 token
- [ ] 更新 `access_token_expires_at`
- [ ] 回傳新的 access_token
- [ ] 錯誤處理:
  - [ ] No linked account
  - [ ] Invalid grant (refresh_token expired)
- [ ] 測試端點 (Postman)

### Task 1.7: Backend API - Google Drive Import
**檔案**: `/frontend/src/app/api/sources/from-drive/route.ts`

- [ ] 建立檔案
- [ ] 實作 `POST` handler
- [ ] 驗證必填欄位 (fileId, fileName, mimeType, access_token)
- [ ] 驗證檔案類型
- [ ] 初始化 Google Drive API client
- [ ] 下載檔案到記憶體 (Buffer)
- [ ] 上傳到 Supabase Storage (`raw-files` bucket)
- [ ] 建立 Source 記錄
- [ ] Link to Project (if project_id provided)
- [ ] 觸發 n8n webhook
- [ ] 錯誤處理:
  - [ ] Invalid file type
  - [ ] Token expired (401)
  - [ ] Download failed
  - [ ] Storage upload failed
  - [ ] Database insert failed
- [ ] Cleanup on failure (刪除已上傳的檔案)
- [ ] 測試端點 (Postman with real Google Drive file)

---

## 🎨 Phase 2: 前端整合 (2 天)

### Task 2.1: Google Drive Picker Hook
**檔案**: `/frontend/src/hooks/useGoogleDrivePicker.ts`

- [ ] 建立檔案
- [ ] 實作 Hook interface:
  ```typescript
  interface UseGoogleDrivePickerProps {
    onFilesSelected: (files: any[]) => void
    onError?: (error: Error) => void
    multiSelect?: boolean
  }
  ```
- [ ] 載入 Google Picker API (useEffect)
- [ ] 載入 Google Identity Services (useEffect)
- [ ] 實作 OAuth 授權流程
- [ ] 實作 `openPicker()` 函數:
  - [ ] 初始化 PickerBuilder
  - [ ] 設定 OAuth token
  - [ ] 設定檔案類型過濾
  - [ ] 處理檔案選擇 callback
- [ ] 測試:
  - [ ] Picker 正常開啟
  - [ ] 檔案選擇成功
  - [ ] 回傳正確的檔案資訊

### Task 2.2: 修改 UploadZone 組件
**檔案**: `/frontend/src/components/knowledge/UploadZone.tsx`

- [ ] 匯入 `useGoogleDrivePicker` Hook
- [ ] 新增 `handleGoogleDriveFiles` 函數
- [ ] 修改 UI:
  - [ ] 新增四個按鈕容器 (`grid grid-cols-4`)
  - [ ] LOCAL BROWSE 按鈕
  - [ ] FROM WEB 按鈕
  - [ ] GOOGLE DRIVE 按鈕
  - [ ] PASTE TEXT 按鈕
- [ ] 整合 `openPicker` 到 GOOGLE DRIVE 按鈕
- [ ] 實作 Loading 狀態顯示
- [ ] 實作錯誤處理與 Toast 通知
- [ ] 測試:
  - [ ] 按鈕樣式正確
  - [ ] 點擊按鈕開啟 Picker
  - [ ] 檔案匯入成功
  - [ ] Loading 狀態正確

### Task 2.3: 擴展 sourcesApi
**檔案**: `/frontend/src/features/sources/api/sourcesApi.ts`

- [ ] 新增 Schema:
  ```typescript
  export const GoogleDriveImportSchema = z.object({
    fileId: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    project_id: z.string().optional(),
  });
  ```
- [ ] 新增 `fromGoogleDrive` 方法
- [ ] 實作 `getGoogleAccessToken` helper:
  - [ ] 檢查 sessionStorage
  - [ ] 自動 refresh if expired
  - [ ] 更新 sessionStorage
- [ ] 錯誤處理:
  - [ ] Token expired → Trigger re-auth
  - [ ] API error → Show message
- [ ] 測試端點呼叫

---

## 🔧 Phase 3: 錯誤處理與優化 (1.5 天)

### Task 3.1: Error Handling & User Feedback

#### 前端錯誤處理
- [ ] 實作標準化錯誤訊息
- [ ] Token 過期提示:
  ```typescript
  toast.error('Google authorization expired. Please reconnect.', {
    action: {
      label: 'Reconnect',
      onClick: () => openPicker()
    }
  })
  ```
- [ ] Rate limit 提示
- [ ] 檔案類型不支援提示
- [ ] 一般錯誤提示

#### 後端錯誤碼標準化
**檔案**: `/frontend/src/lib/api-errors.ts`

- [ ] 定義 `GoogleDriveErrorCode` enum
- [ ] 建立 `GoogleDriveError` class
- [ ] 更新所有 API routes 使用標準錯誤碼
- [ ] 測試錯誤情境

### Task 3.2: Rate Limiting
**檔案**: `/frontend/src/lib/rate-limit.ts`

- [ ] 實作 `checkRateLimit` 函數
- [ ] 定義限制策略:
  - [ ] Token Refresh: 5 requests / 5 minutes
  - [ ] File Import: 20 files / 1 minute
  - [ ] OAuth Callback: 10 requests / 10 minutes
- [ ] 整合到各 API routes:
  - [ ] `/api/auth/google/callback`
  - [ ] `/api/auth/google/refresh`
  - [ ] `/api/sources/from-drive`
- [ ] 回傳 429 錯誤當超過限制
- [ ] 測試 rate limiting

### Task 3.3: 效能優化
- [ ] 實作記憶體清理（檔案 Buffer 處理後）
- [ ] 新增檔案大小限制檢查（< 50MB）
- [ ] 優化 token refresh 邏輯（避免重複請求）
- [ ] 測試並發請求處理

---

## 🧪 Phase 4: 測試與文檔 (1.5 天)

### Task 4.1: 整合測試

#### OAuth 流程測試
- [ ] 首次授權成功
- [ ] 拒絕授權正確處理
- [ ] State 驗證通過
- [ ] State 驗證失敗（invalid state）
- [ ] Refresh token 正確存儲（加密）
- [ ] Refresh token 正確解密

#### Google Picker 測試
- [ ] Picker 正常開啟
- [ ] 單選檔案
- [ ] 多選檔案（3-5 個）
- [ ] 檔案類型過濾正確
- [ ] 取消選擇正確處理

#### 檔案匯入測試
- [ ] PDF 檔案成功匯入
- [ ] DOCX 檔案成功匯入
- [ ] TXT 檔案成功匯入
- [ ] Markdown 檔案成功匯入
- [ ] 不支援的檔案類型被拒絕（如 .zip）
- [ ] 大檔案警告（> 10MB）
- [ ] Source 記錄正確建立
- [ ] `source_type` 為 `google_drive`
- [ ] Project link 正確建立
- [ ] n8n webhook 成功觸發
- [ ] 檔案出現在 Supabase Storage

#### 錯誤處理測試
- [ ] Token 過期自動 refresh
- [ ] Refresh token 過期要求重新授權
- [ ] 網路錯誤重試
- [ ] Rate limit 正確限制
- [ ] Storage 上傳失敗正確 cleanup
- [ ] Database insert 失敗正確 cleanup

#### 安全性測試
- [ ] Refresh token 加密存儲
- [ ] State CSRF 保護生效
- [ ] RLS 政策正確（使用者 A 無法存取使用者 B 的 tokens）
- [ ] Access token 不存儲於前端
- [ ] 無敏感資訊洩漏於日誌

#### 效能測試
- [ ] 單個檔案匯入時間 < 5 秒
- [ ] 5 個檔案同時匯入時間 < 15 秒
- [ ] Token refresh 時間 < 1 秒
- [ ] 無記憶體洩漏

### Task 4.2: 文檔撰寫

#### 開發者文檔
**檔案**: `/docs/GOOGLE_DRIVE_INTEGRATION.md`

- [ ] Quick Start 指南
- [ ] Prerequisites
- [ ] 使用者流程說明
- [ ] 架構圖
- [ ] API 端點文檔
- [ ] 環境變數說明
- [ ] 故障排除指南
- [ ] 常見問題 (FAQ)

#### 使用者文檔
**檔案**: `/docs/USER_GUIDE_GOOGLE_DRIVE.md`

- [ ] 如何使用 Google Drive 匯入
- [ ] 步驟截圖
- [ ] 支援的檔案類型
- [ ] 常見問題
- [ ] 授權說明

#### 技術決策文檔
- [ ] ADR-001: OAuth 實作方式選擇
- [ ] ADR-002: Token 存儲策略
- [ ] ADR-003: 檔案處理策略

---

## 🚀 Phase 5: 上線準備

### Pre-Launch Checklist

#### 環境變數確認
- [ ] 測試環境配置完成
- [ ] 生產環境配置完成
- [ ] Redirect URIs 包含生產域名
- [ ] Token 加密金鑰已備份

#### 資料庫遷移
- [ ] Migration 在測試環境執行成功
- [ ] Migration 在生產環境執行成功
- [ ] 備份資料庫
- [ ] RLS 政策驗證通過

#### 安全檢查
- [ ] CSRF Protection 生效
- [ ] Rate Limiting 配置正確
- [ ] Token 加密測試通過
- [ ] 安全稽核通過
- [ ] 無敏感資訊洩漏

#### 功能測試
- [ ] 所有整合測試通過
- [ ] 在測試環境完整測試
- [ ] 在生產環境 Staging 測試
- [ ] 多使用者並發測試
- [ ] 跨瀏覽器測試 (Chrome, Safari, Firefox)

#### 監控設定
- [ ] Metrics 正確上報
- [ ] Alert rules 配置
- [ ] Dashboard 建立
- [ ] Error tracking 設定 (Sentry/LogRocket)

#### 文檔完成
- [ ] 開發者文檔完成
- [ ] 使用者指南完成
- [ ] API 文檔完成
- [ ] Runbook 完成

### Beta 測試計畫
- [ ] 選定 10-20 位 early adopters
- [ ] 發送 Beta 測試邀請
- [ ] 收集使用回饋
- [ ] 監控錯誤率與效能
- [ ] 修復發現的問題
- [ ] Beta 測試報告

### 上線步驟
- [ ] 灰度發布 30% 使用者
- [ ] 監控 24 小時
- [ ] 灰度發布 50% 使用者
- [ ] 監控 24 小時
- [ ] 全面上線 100% 使用者
- [ ] 發送產品更新公告
- [ ] 監控一週

### Rollback 準備
- [ ] Rollback 計畫文檔化
- [ ] Feature Flag 機制就位
- [ ] 快速關閉 Google Drive 按鈕的方式
- [ ] 通知模板準備

---

## 📊 驗收標準總覽

### 功能驗收
- [ ] ✅ 使用者可以點擊 "GOOGLE DRIVE" 按鈕
- [ ] ✅ 首次使用完成 Google OAuth 授權
- [ ] ✅ Google Picker 正常顯示
- [ ] ✅ 可以選擇單個或多個檔案
- [ ] ✅ 檔案類型過濾正確
- [ ] ✅ 檔案成功匯入並顯示
- [ ] ✅ Source 記錄正確建立
- [ ] ✅ n8n workflow 成功觸發
- [ ] ✅ 錯誤訊息清晰

### 安全驗收
- [ ] ✅ Refresh token 加密存儲
- [ ] ✅ State token CSRF 保護
- [ ] ✅ RLS 政策生效
- [ ] ✅ Rate limiting 正確
- [ ] ✅ 無敏感資訊洩漏

### 效能驗收
- [ ] ✅ 檔案匯入時間 < 5 秒
- [ ] ✅ Token refresh < 1 秒
- [ ] ✅ 支援同時匯入 10 個檔案
- [ ] ✅ 無記憶體洩漏

---

## 📈 里程碑追蹤

| 里程碑 | 預計日期 | 實際日期 | 狀態 | 備註 |
|--------|----------|----------|------|------|
| M0: 基礎設施準備完成 | Day 0.5 | | ⏳ Pending | |
| M1: 後端 API 完成 | Day 3 | | ⏳ Pending | |
| M2: 前端整合完成 | Day 5 | | ⏳ Pending | |
| M3: 測試與優化完成 | Day 7 | | ⏳ Pending | |
| M4: 準備上線 | Day 8 | | ⏳ Pending | |
| M5: Beta 測試完成 | Day 13 | | ⏳ Pending | |
| M6: 正式上線 | Day 16 | | ⏳ Pending | |

---

## 📝 Notes & Issues

### 開發過程記錄
<!-- 在實作過程中記錄重要決策、遇到的問題、解決方案 -->

**日期**: [Date]
**問題**: [Description]
**解決方案**: [Solution]
**影響**: [Impact]

---

### 待辦事項
<!-- 實作過程中發現的額外工作 -->

- [ ] [Task description]

---

### 已知問題
<!-- 已知但尚未修復的問題 -->

- [ ] [Issue description]

---

**檢查清單版本**: 1.0
**最後更新**: 2026-01-19
**負責人**: [待分配]

---

## 🎉 完成確認

- [ ] 所有 Phase 任務完成
- [ ] 所有驗收標準通過
- [ ] 文檔完整
- [ ] 上線成功
- [ ] 監控正常
- [ ] 專案經理簽核

**簽核人**: ___________________
**日期**: ___________________

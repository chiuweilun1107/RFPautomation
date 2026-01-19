# Google Drive Integration - Product Requirements Document (PRD)

**專案經理**: Adam
**日期**: 2026-01-19
**版本**: 1.0
**狀態**: Ready for Review & Implementation

---

## 🎯 Executive Summary

### 產品目標
為現有的 NotebookLM-style 知識管理系統新增 **Google Drive 整合功能**，讓使用者能直接從 Google Drive 選擇並匯入文件到系統中進行處理，無縫接軌現有的 Source 建立與 n8n 處理流程。

### 成功指標
- **採用率**: ≥ 30% 使用者在首次上傳時使用 Google Drive
- **轉換率**: Google Drive 導入成功率 ≥ 95%
- **效能**: 檔案選擇到建立 Source 的時間 < 5 秒
- **安全性**: 零資安事件，通過 OAuth 2.0 安全稽核

### 範圍定義

#### ✅ 本次納入 (MVP Scope)
1. **OAuth 2.0 Google 登入整合**
2. **Google Picker API 檔案選擇器**
3. **後端 API `/api/sources/from-drive`**
4. **支援檔案類型**: PDF, DOCX, TXT, Markdown
5. **複用現有 Source 建立流程與 n8n webhook**
6. **Token 安全管理（加密存儲於 Supabase）**

#### ❌ 本次不納入 (Out of Scope)
1. Google Docs/Sheets/Slides 線上編輯器檔案（需轉換 API）
2. 自動同步 Google Drive 變更
3. Google Drive 資料夾監聽
4. 大檔案（> 50MB）串流下載
5. 多人協作權限管理

---

## 🏗️ 系統架構設計

### 整體流程架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                       使用者點擊 "GOOGLE DRIVE"                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. 前端觸發 OAuth 2.0 Flow                                       │
│    - 使用 Google Identity Services (GIS)                        │
│    - Redirect to Google Authorization                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 使用者授權並回調                                              │
│    - Scopes: drive.readonly, drive.file                         │
│    - 獲得 authorization_code                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 前端呼叫後端 Token Exchange                                   │
│    POST /api/auth/google/callback                               │
│    - Backend 用 code 換 access_token + refresh_token           │
│    - 加密存儲 refresh_token 到 Supabase auth.identities         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 前端開啟 Google Picker                                        │
│    - 使用 access_token                                          │
│    - 限制檔案類型: application/pdf, .docx, .txt, .md           │
│    - 單選或多選檔案                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. 使用者選擇檔案並確認                                          │
│    - 獲得 file.id, file.name, file.mimeType                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. 前端呼叫後端 Import API                                       │
│    POST /api/sources/from-drive                                 │
│    Body: { fileId, fileName, mimeType, project_id }            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. 後端處理流程                                                  │
│    a. 驗證 access_token（自動 refresh if expired）              │
│    b. 使用 Drive API 下載檔案到記憶體                           │
│    c. 上傳到 Supabase Storage (raw-files bucket)                │
│    d. 建立 Source record (source_type: 'google_drive')          │
│    e. 觸發 n8n ingest webhook                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. 回傳結果給前端                                                │
│    - Success: { source, message }                               │
│    - Error: { error, details }                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. 前端顯示結果並刷新列表                                        │
│    - Toast notification                                          │
│    - router.refresh()                                            │
│    - onUploadComplete()                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 技術棧

**現有系統**:
- **前端**: Next.js 16 + React 19 + TypeScript
- **後端**: Next.js API Routes
- **認證**: Supabase Auth
- **儲存**: Supabase Storage (raw-files bucket)
- **資料庫**: Supabase PostgreSQL
- **處理**: n8n workflows

**新增依賴**:
- **Google APIs**: `googleapis` (Node.js)
- **Google Picker**: Google Picker API (CDN)
- **Google Identity**: Google Identity Services (CDN)
- **加密**: Node.js `crypto` module (內建)

---

## 🔐 OAuth 2.0 整合策略

### 技術選型決策 (ADR-001)

| 方案 | 優點 | 缺點 | 選擇 |
|------|------|------|------|
| **方案 A: Supabase Auth Provider** | 內建整合、簡單配置 | ❌ 不支援 Google Drive scopes | ❌ |
| **方案 B: 純前端 OAuth (PKCE)** | 快速實作 | ❌ refresh_token 難以安全存儲 | ❌ |
| **方案 C: 後端代理 OAuth** | ✅ 完全控制、安全 | 需要額外開發 | ✅ **採用** |

**決策理由**:
1. ✅ Refresh token 安全存儲於後端資料庫
2. ✅ 完全控制 token 生命週期
3. ✅ 符合 OAuth 2.0 最佳實踐
4. ✅ 複用現有 Supabase Auth 的使用者系統

### Google Cloud Console 配置

```yaml
Project Name: NotebookLM Knowledge System
OAuth 2.0 Client:
  Type: Web Application
  Authorized JavaScript origins:
    - http://localhost:3000
    - https://your-production-domain.com
  Authorized redirect URIs:
    - http://localhost:3000/api/auth/google/callback
    - https://your-production-domain.com/api/auth/google/callback

Enabled APIs:
  - Google Drive API
  - Google Picker API

OAuth Scopes:
  - https://www.googleapis.com/auth/drive.readonly (讀取檔案)
  - https://www.googleapis.com/auth/drive.file (上傳使用者選擇的檔案)
```

### 環境變數配置

```bash
# frontend/.env.local (新增)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=AIzaSy...your-api-key
GOOGLE_TOKEN_ENCRYPTION_KEY=<32-byte-hex>
```

**生成加密金鑰**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token 存儲策略 (ADR-002)

**決策**: 使用 AES-256-GCM 加密存儲於 Supabase PostgreSQL

**理由**:
1. ✅ 即使資料庫洩漏，也無法直接使用 token
2. ✅ 符合 GDPR 與資料保護法規
3. ✅ 加密金鑰獨立管理（環境變數）
4. ✅ GCM 模式提供認證加密（防竄改）

**資料表設計**:

```sql
CREATE TABLE public.google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_refresh_token text NOT NULL,
  access_token_expires_at timestamp with time zone,
  scope text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT unique_user_google_token UNIQUE(user_id)
);

CREATE TABLE public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own Google tokens"
  ON public.google_tokens FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own OAuth states"
  ON public.oauth_states FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📡 API 端點設計

### 1. OAuth State 生成端點

**路徑**: `GET /api/auth/google/generate-state`

**描述**: 生成 CSRF protection state token

**Response**:
```json
{
  "state": "a7f8b2c9d4e1f6a5b7c8d9e0f1a2b3c4"
}
```

### 2. OAuth Callback Endpoint

**路徑**: `POST /api/auth/google/callback`

**Request Body**:
```typescript
{
  code: string;           // Authorization code from Google
  state: string;          // CSRF protection token
}
```

**Response**:
```typescript
{
  success: true;
  access_token: string;   // 短期 access token (1h)
  expires_in: number;     // 3600
  scope: string[];        // 授權的 scopes
}
```

**核心邏輯**:
1. 驗證 state (CSRF protection)
2. Exchange code for tokens
3. 加密並存儲 refresh_token
4. 回傳短期 access_token 給前端

### 3. Token Refresh Endpoint

**路徑**: `POST /api/auth/google/refresh`

**Request Body**: (Empty - 自動從資料庫取得 refresh_token)

**Response**:
```typescript
{
  access_token: string;
  expires_in: number;
}
```

**核心邏輯**:
1. 取得加密的 refresh_token
2. 解密並刷新 token
3. 更新過期時間
4. 回傳新的 access_token

### 4. Google Drive Import Endpoint

**路徑**: `POST /api/sources/from-drive`

**Request Body**:
```typescript
{
  fileId: string;         // Google Drive file ID
  fileName: string;       // Original file name
  mimeType: string;       // MIME type
  project_id?: string;    // Project ID (optional)
  access_token: string;   // 前端傳遞的 access_token
}
```

**Response**:
```typescript
{
  success: true;
  source: {
    id: string;
    title: string;
    origin_url: string;   // Supabase Storage path
    type: string;
    status: 'processing';
    source_type: 'google_drive';
  };
  message: string;
}
```

**核心邏輯**:
1. 驗證 access_token（自動 refresh if expired）
2. 使用 Drive API 下載檔案到記憶體
3. 上傳到 Supabase Storage (raw-files bucket)
4. 建立 Source 記錄
5. Link to Project (if project_id provided)
6. 觸發 n8n ingest webhook

**支援的 MIME Types**:
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `text/plain`
- `text/markdown`

---

## 🎨 前端實作計畫

### 1. 修改 UploadZone 組件

**檔案**: `/frontend/src/components/knowledge/UploadZone.tsx`

**修改內容**:
- 新增 `useGoogleDrivePicker` Hook
- 新增 `handleGoogleDriveFiles` 函數
- 新增四個按鈕：LOCAL BROWSE、FROM WEB、GOOGLE DRIVE、PASTE TEXT

**關鍵程式碼**:
```tsx
const { openPicker, isReady } = useGoogleDrivePicker({
  onFilesSelected: handleGoogleDriveFiles,
  onError: (error) => {
    toast.error(`Google Drive Error: ${error.message}`)
  }
})

const handleGoogleDriveFiles = async (files: any[]) => {
  setIsUploading(true)

  for (const file of files) {
    try {
      await sourcesApi.fromGoogleDrive({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        project_id: selectedFolderId || ''
      })

      toast.success(`Imported: ${file.name}`)
    } catch (error: any) {
      toast.error(`Failed ${file.name}: ${error.message}`)
    }
  }

  setIsUploading(false)
  router.refresh()
  onUploadComplete?.()
}
```

### 2. 建立 Google Drive Picker Hook

**檔案**: `/frontend/src/hooks/useGoogleDrivePicker.ts`

**功能**:
- 載入 Google Picker API 與 Google Identity Services
- 處理 OAuth 授權流程
- 開啟檔案選擇器
- 回傳選擇的檔案資訊

**關鍵函數**:
```typescript
export function useGoogleDrivePicker({
  onFilesSelected,
  onError,
  multiSelect = true
}: UseGoogleDrivePickerProps) {
  const [isReady, setIsReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Load Google API Scripts
  useEffect(() => { ... })

  // Initialize Google Identity Services
  useEffect(() => { ... })

  // Open Picker
  const openPicker = useCallback(() => {
    const picker = new google.picker.PickerBuilder()
      .setAppId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!)
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY!)
      .addView(new google.picker.DocsView().setMimeTypes('...'))
      .setCallback((data) => { ... })
      .build()

    picker.setVisible(true)
  }, [accessToken, onFilesSelected])

  return { openPicker, isReady, accessToken }
}
```

### 3. 擴展 sourcesApi

**檔案**: `/frontend/src/features/sources/api/sourcesApi.ts`

**新增方法**:
```typescript
export const sourcesApi = {
  // ... 原有方法 ...

  /**
   * Import file from Google Drive
   */
  async fromGoogleDrive(input: GoogleDriveImportInput): Promise<Source> {
    const accessToken = await getGoogleAccessToken();

    const { data } = await apiClient.post<{ source: Source }>('/api/sources/from-drive', {
      ...input,
      access_token: accessToken
    });

    return SourceSchema.parse(data.source);
  },
};

// Helper function
async function getGoogleAccessToken(): Promise<string> {
  // Try to get from sessionStorage first
  const storedToken = sessionStorage.getItem('google_access_token');
  const expiresAt = sessionStorage.getItem('google_token_expires_at');

  if (storedToken && expiresAt && Date.now() < parseInt(expiresAt)) {
    return storedToken;
  }

  // Refresh token
  const response = await fetch('/api/auth/google/refresh', {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await response.json();

  sessionStorage.setItem('google_access_token', data.access_token);
  sessionStorage.setItem('google_token_expires_at',
    (Date.now() + data.expires_in * 1000).toString());

  return data.access_token;
}
```

---

## 🔒 安全性實作

### 1. Token 加密工具

**檔案**: `/frontend/src/lib/crypto.ts`

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY!, 'hex');
const IV_LENGTH = 16;

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 2. CSRF Protection

**實作 State Token**:
- 每次 OAuth 流程開始前，後端生成隨機 state
- State 存入資料庫並設定 5 分鐘過期
- Callback 時驗證 state 是否有效
- 使用後立即刪除 state

### 3. Rate Limiting

**檔案**: `/frontend/src/lib/rate-limit.ts`

**限制策略**:
- **Token Refresh**: 5 requests / 5 minutes
- **File Import**: 20 files / 1 minute
- **OAuth Callback**: 10 requests / 10 minutes

```typescript
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<boolean> {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## 🚀 實作階段與優先級

### RICE 優先級分析

| 任務 | RICE Score | Reach | Impact | Confidence | Effort |
|------|------------|-------|--------|------------|--------|
| Google Cloud Console 配置 | 50.0 | 100 | 3.0 | 1.0 | xs |
| 資料庫 Schema | 16.67 | 100 | 2.0 | 1.0 | s |
| Token 加密工具 | 16.67 | 100 | 3.0 | 1.0 | s |
| Backend API: Token Refresh | 16.67 | 100 | 2.0 | 1.0 | s |
| Frontend: Modify UploadZone | 16.67 | 100 | 2.0 | 1.0 | s |
| Frontend: Extend sourcesApi | 16.67 | 100 | 2.0 | 1.0 | s |
| CSRF Protection | 16.67 | 100 | 2.0 | 1.0 | s |
| Backend API: Google Callback | 10.0 | 100 | 3.0 | 1.0 | m |
| Frontend: useGoogleDrivePicker | 10.0 | 100 | 3.0 | 0.8 | m |
| Backend API: from-drive | 6.25 | 100 | 3.0 | 0.8 | l |

### 實作階段

#### **Phase 0: 基礎設施準備（0.5 天）**
- [ ] Google Cloud Console 配置
- [ ] 環境變數配置
- [ ] 生成加密金鑰

#### **Phase 1: 後端基礎建設（2.5 天）**
- [ ] 資料庫 Schema Migration
- [ ] Token 加密工具
- [ ] CSRF Protection (State Token)
- [ ] Backend API: Google Callback
- [ ] Backend API: Token Refresh
- [ ] Backend API: Google Drive Import

#### **Phase 2: 前端整合（2 天）**
- [ ] Google Drive Picker Hook
- [ ] 修改 UploadZone 組件
- [ ] 擴展 sourcesApi
- [ ] 整合測試

#### **Phase 3: 錯誤處理與優化（1.5 天）**
- [ ] Error Handling & User Feedback
- [ ] Rate Limiting
- [ ] 效能優化

#### **Phase 4: 測試與文檔（1.5 天）**
- [ ] 整合測試
- [ ] 安全性測試
- [ ] 撰寫開發者文檔
- [ ] 撰寫使用者指南

### 時間估算

| 階段 | 預估工時 | 累積工時 |
|------|----------|----------|
| Phase 0 | 0.5 天 | 0.5 天 |
| Phase 1 | 2.5 天 | 3 天 |
| Phase 2 | 2 天 | 5 天 |
| Phase 3 | 1.5 天 | 6.5 天 |
| Phase 4 | 1.5 天 | **8 天** |

**總計**: **8 個工作天（1.6 週）**

### 里程碑

- **M1 (Day 3)**: 後端 API 完成，可通過 Postman 測試
- **M2 (Day 5)**: 前端整合完成，可在 UI 匯入檔案
- **M3 (Day 7)**: 錯誤處理與安全性完成
- **M4 (Day 8)**: 測試通過，準備上線

---

## 🔍 風險評估與應對策略

| 風險 | 機率 | 影響 | 應對策略 |
|------|------|------|----------|
| **Google API 配額不足** | 中 | 高 | 申請更高配額；實作本地快取 |
| **Refresh token 過期** | 中 | 中 | 實作重新授權流程；通知使用者 |
| **檔案下載失敗** | 低 | 中 | 實作重試機制（3 次） |
| **Supabase Storage 容量限制** | 低 | 高 | 監控使用量；實作自動清理 |
| **n8n webhook 逾時** | 中 | 低 | 非同步處理；不阻塞 API 回應 |
| **CSRF 攻擊** | 低 | 高 | 強制 State 驗證；短期過期時間 |

---

## 📈 成功指標與監控

### 關鍵指標 (KPIs)

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| **採用率** | ≥ 30% 首次上傳使用 Google Drive | Google Analytics Event Tracking |
| **成功率** | ≥ 95% 匯入成功 | API 成功/失敗比例 |
| **平均匯入時間** | < 5 秒 | API Response Time |
| **Token 刷新成功率** | ≥ 99% | Token refresh API 成功率 |
| **錯誤率** | < 5% | Error logs 分析 |
| **使用者滿意度** | ≥ 4.0/5.0 | In-app feedback |

### 監控指標

```typescript
// Metrics to track
metrics.increment('google_drive.import.started')
metrics.increment('google_drive.import.success')
metrics.increment('google_drive.import.failed', { reason: 'token_expired' })
metrics.timing('google_drive.import.duration', durationMs)
metrics.gauge('google_drive.token_refresh.count', count)
```

### Alert Rules

- 匯入失敗率 > 10% → 立即通知 On-call Engineer
- Token refresh 失敗率 > 5% → 通知 Backend Team
- 平均匯入時間 > 10 秒 → 調查效能瓶頸

---

## 🚀 上線計畫

### Pre-Launch Checklist

- [ ] **環境變數確認**
  - [ ] Google Client ID/Secret 已配置
  - [ ] Token 加密金鑰已生成並配置
  - [ ] Redirect URIs 包含生產環境域名

- [ ] **資料庫遷移**
  - [ ] Migration 已在測試環境測試
  - [ ] Migration 已在生產環境執行
  - [ ] RLS 政策已驗證

- [ ] **安全檢查**
  - [ ] CSRF Protection 生效
  - [ ] Rate Limiting 配置正確
  - [ ] Token 加密測試通過
  - [ ] 無敏感資訊洩漏

- [ ] **功能測試**
  - [ ] OAuth 流程完整測試
  - [ ] 所有檔案類型測試
  - [ ] 錯誤情境測試
  - [ ] 多使用者並發測試

- [ ] **文檔完成**
  - [ ] 開發者文檔
  - [ ] 使用者指南
  - [ ] 故障排除文檔

- [ ] **監控就位**
  - [ ] Metrics 正確上報
  - [ ] Alert rules 配置
  - [ ] Dashboard 建立

### 上線步驟

1. **Beta 測試（1 週）**
   - 開放給 10-20 位 early adopters
   - 收集使用回饋
   - 監控錯誤率與效能

2. **灰度發布（3 天）**
   - 逐步開放給 30% → 50% → 100% 使用者
   - 持續監控指標

3. **全面上線**
   - 更新產品公告
   - 發送使用者通知
   - 監控一週

### Rollback 計畫

**觸發條件**:
- 匯入失敗率 > 20%
- 發現嚴重安全漏洞
- 系統不穩定影響現有功能

**Rollback 步驟**:
1. Feature Flag 關閉 Google Drive 按鈕
2. 資料庫保留（不 rollback migration）
3. 通知已連結 Google 帳號的使用者
4. 修復問題後重新發布

---

## 📝 附錄

### 依賴套件

```bash
# 後端
npm install googleapis @types/googleapis

# 前端 (無需安裝，使用 CDN)
# - Google Picker API
# - Google Identity Services
```

### 參考文檔

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Picker API Documentation](https://developers.google.com/picker)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/rfc8252)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

### 技術決策記錄 (ADRs)

- **ADR-001**: OAuth 實作方式選擇（後端代理）
- **ADR-002**: Token 存儲策略（AES-256-GCM 加密）
- **ADR-003**: 檔案處理策略（下載到記憶體再上傳）

---

## ✅ 驗收標準

### 功能驗收

- [ ] 使用者可以點擊 "GOOGLE DRIVE" 按鈕
- [ ] 首次使用時，完成 Google OAuth 授權
- [ ] Google Picker 正常開啟並顯示使用者的 Google Drive 檔案
- [ ] 可以選擇單個或多個檔案
- [ ] 檔案類型過濾正確（只顯示 PDF、DOCX、TXT、MD）
- [ ] 選擇的檔案成功匯入並顯示在 Sources 列表
- [ ] Source 記錄正確建立（source_type: 'google_drive'）
- [ ] n8n workflow 成功觸發並處理檔案
- [ ] 錯誤訊息清晰且可操作

### 安全驗收

- [ ] Refresh token 加密存儲於資料庫
- [ ] State token 正確驗證（CSRF 保護）
- [ ] RLS 政策生效（使用者只能存取自己的 tokens）
- [ ] Rate limiting 正確限制請求頻率
- [ ] 無敏感資訊洩漏於前端或日誌

### 效能驗收

- [ ] 檔案選擇到建立 Source 的時間 < 5 秒
- [ ] Token refresh 時間 < 1 秒
- [ ] 支援同時匯入最多 10 個檔案
- [ ] 無記憶體洩漏

---

**文檔版本**: 1.0
**最後更新**: 2026-01-19
**簽核狀態**: Pending Review

---

**下一步行動**:
1. 專案經理 Review 並獲得利益相關者簽核
2. 建立 Jira Epic 與 Tasks
3. 分配開發資源
4. 開始 Phase 0 基礎設施準備

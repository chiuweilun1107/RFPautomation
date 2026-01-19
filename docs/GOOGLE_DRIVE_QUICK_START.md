# Google Drive Integration - Quick Start Guide

**目標**: 30 分鐘內完成 Google Drive 整合的基礎設定與第一個檔案匯入

**適合對象**: 熟悉 Next.js、TypeScript、Supabase 的開發者

---

## 🚀 Step 1: Google Cloud Console 設定 (10 分鐘)

### 1.1 建立 Google Cloud Project

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「建立專案」
3. 專案名稱：`NotebookLM Knowledge System`
4. 點擊「建立」

### 1.2 啟用必要的 APIs

```bash
# 或在 Console UI 中啟用
APIs & Services > Enable APIs and Services

搜尋並啟用:
1. Google Drive API
2. Google Picker API
```

### 1.3 建立 OAuth 2.0 憑證

1. **APIs & Services > Credentials**
2. 點擊「**CREATE CREDENTIALS**」→「**OAuth client ID**」
3. Application type: **Web application**
4. Name: `NotebookLM Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://your-production-domain.com/api/auth/google/callback
   ```
7. 點擊「**CREATE**」
8. **複製 Client ID 和 Client Secret**（稍後需要）

### 1.4 建立 API Key (for Picker)

1. **Credentials > CREATE CREDENTIALS > API Key**
2. **複製 API Key**
3. （建議）限制 API Key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**:
     ```
     http://localhost:3000/*
     https://your-production-domain.com/*
     ```
   - **API restrictions**: Google Picker API

---

## 🔐 Step 2: 環境變數設定 (5 分鐘)

### 2.1 生成 Token 加密金鑰

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

輸出範例：
```
7f3a8b2c9d4e1f6a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

### 2.2 更新 `.env.local`

```bash
cd frontend
nano .env.local
```

新增以下變數：

```bash
# Google Drive Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_TOKEN_ENCRYPTION_KEY=7f3a8b2c9d4e1f6a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

---

## 🗄️ Step 3: 資料庫設定 (5 分鐘)

### 3.1 安裝 Supabase CLI (如果尚未安裝)

```bash
brew install supabase/tap/supabase  # macOS
# or
npm install -g supabase             # npm
```

### 3.2 建立 Migration 檔案

```bash
cd backend
supabase migration new google_drive_integration
```

### 3.3 複製 SQL Schema

編輯新建的 migration 檔案：

```sql
-- Google Tokens Table
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_refresh_token text NOT NULL,
  access_token_expires_at timestamp with time zone,
  scope text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT unique_user_google_token UNIQUE(user_id)
);

-- OAuth State Table (CSRF Protection)
CREATE TABLE IF NOT EXISTS public.oauth_states (
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

-- Update sources table
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS source_type text
  CHECK (source_type IN ('upload', 'url', 'text', 'google_drive'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON public.google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);
```

### 3.4 執行 Migration

```bash
supabase db push
```

驗證成功：
```bash
supabase db diff
# 應該顯示 "No changes detected"
```

---

## 📦 Step 4: 安裝依賴 (2 分鐘)

```bash
cd frontend
npm install googleapis @types/googleapis
```

驗證安裝：
```bash
npm list googleapis
# 應該顯示已安裝的版本
```

---

## 💻 Step 5: 實作核心檔案 (8 分鐘)

### 5.1 建立 Token 加密工具

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

### 5.2 測試加密工具

建立測試檔案 `/frontend/test-crypto.ts`:

```typescript
import { encryptToken, decryptToken } from './src/lib/crypto';

const testToken = 'ya29.test_token_123456';
console.log('Original:', testToken);

const encrypted = encryptToken(testToken);
console.log('Encrypted:', encrypted);

const decrypted = decryptToken(encrypted);
console.log('Decrypted:', decrypted);

console.assert(testToken === decrypted, '❌ Encryption test FAILED!');
console.log('✅ Encryption test PASSED!');
```

執行測試：
```bash
npx ts-node test-crypto.ts
```

### 5.3 建立 OAuth Callback API

**檔案**: `/frontend/src/app/api/auth/google/callback/route.ts`

```typescript
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { encryptToken } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify state
    const { data: stateRecord } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!stateRecord) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('id', stateRecord.id);

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${request.headers.get('origin')}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json({
        error: 'No refresh token. Please revoke and reconnect.'
      }, { status: 400 });
    }

    // Encrypt and store
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    await supabase.from('google_tokens').upsert({
      user_id: user.id,
      encrypted_refresh_token: encryptedRefreshToken,
      access_token_expires_at: new Date(tokens.expiry_date!).toISOString(),
      scope: tokens.scope?.split(' ') || []
    }, { onConflict: 'user_id' });

    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      expires_in: Math.floor((tokens.expiry_date! - Date.now()) / 1000)
    });

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🧪 Step 6: 快速測試 (5 分鐘)

### 6.1 啟動開發伺服器

```bash
cd frontend
npm run dev
```

### 6.2 測試 OAuth 流程

1. 開啟瀏覽器開發工具 (F12)
2. 在 Console 執行：

```javascript
// 1. 生成 state
const stateRes = await fetch('/api/auth/google/generate-state');
const { state } = await stateRes.json();
console.log('State:', state);

// 2. 建構 OAuth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${window.location.origin}/api/auth/google/callback` +
  `&response_type=code` +
  `&scope=https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file` +
  `&state=${state}` +
  `&access_type=offline` +
  `&prompt=consent`;

// 3. 開啟授權頁面
window.open(authUrl, '_blank');
```

3. 在新視窗中完成 Google 授權
4. 複製回調 URL 中的 `code` 參數
5. 在 Console 執行：

```javascript
// 4. Exchange code for tokens
const callbackRes = await fetch('/api/auth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: '<從 URL 複製的 code>', state })
});

const result = await callbackRes.json();
console.log('Result:', result);
// 應該看到: { success: true, access_token: '...', expires_in: 3600 }
```

### 6.3 驗證資料庫

在 Supabase Dashboard 中檢查：

1. **Table: google_tokens**
   - 應該有一筆記錄
   - `encrypted_refresh_token` 欄位有值
   - `user_id` 對應當前使用者

2. **Table: oauth_states**
   - 應該是空的（已使用的 state 已刪除）

---

## 🎉 成功！下一步

### ✅ 你已經完成：
- [x] Google Cloud Console 配置
- [x] 環境變數設定
- [x] 資料庫 Schema
- [x] OAuth 2.0 授權流程
- [x] Token 加密存儲

### 📋 接下來的工作：

1. **實作 Token Refresh API**
   - 檔案：`/api/auth/google/refresh/route.ts`
   - 參考：[完整 PRD - API 端點設計](#)

2. **實作 Google Drive Import API**
   - 檔案：`/api/sources/from-drive/route.ts`
   - 參考：[完整 PRD - API 端點設計](#)

3. **建立前端 Hook**
   - 檔案：`/hooks/useGoogleDrivePicker.ts`
   - 參考：[完整 PRD - 前端實作計畫](#)

4. **修改 UploadZone 組件**
   - 檔案：`/components/knowledge/UploadZone.tsx`
   - 參考：[完整 PRD - 前端實作計畫](#)

---

## 🐛 常見問題排查

### 問題 1: "No refresh token received"

**原因**: Google 只在首次授權時提供 refresh_token

**解決**:
1. 前往 [Google 帳戶權限](https://myaccount.google.com/permissions)
2. 移除「NotebookLM Knowledge System」應用程式
3. 重新執行 OAuth 流程並確保 URL 包含 `prompt=consent`

### 問題 2: "Invalid state"

**原因**: State token 已過期（5 分鐘）或已使用

**解決**:
1. 重新生成新的 state
2. 確保授權流程在 5 分鐘內完成
3. 不要重複使用同一個 code

### 問題 3: "GOOGLE_TOKEN_ENCRYPTION_KEY is not defined"

**原因**: 環境變數未正確載入

**解決**:
```bash
# 檢查 .env.local 是否存在
ls -la frontend/.env.local

# 重啟開發伺服器
npm run dev
```

### 問題 4: Database migration 失敗

**原因**: Supabase 連線問題或權限不足

**解決**:
```bash
# 檢查 Supabase 連線
supabase status

# 重新登入
supabase login

# 檢查 project 連結
supabase link --project-ref <your-project-id>
```

---

## 📚 參考文檔

- [完整 PRD](/docs/PRD_GOOGLE_DRIVE_INTEGRATION.md)
- [實作檢查清單](/docs/GOOGLE_DRIVE_IMPLEMENTATION_CHECKLIST.md)
- [Google Drive API Docs](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Picker API Docs](https://developers.google.com/picker)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/rfc8252)

---

## 💡 開發提示

### 使用 Postman 測試 API

建立 Collection：

```json
{
  "name": "Google Drive Integration",
  "requests": [
    {
      "name": "Generate State",
      "method": "GET",
      "url": "http://localhost:3000/api/auth/google/generate-state",
      "headers": {
        "Authorization": "Bearer {{supabase_token}}"
      }
    },
    {
      "name": "OAuth Callback",
      "method": "POST",
      "url": "http://localhost:3000/api/auth/google/callback",
      "body": {
        "code": "{{oauth_code}}",
        "state": "{{state}}"
      }
    },
    {
      "name": "Refresh Token",
      "method": "POST",
      "url": "http://localhost:3000/api/auth/google/refresh",
      "headers": {
        "Authorization": "Bearer {{supabase_token}}"
      }
    }
  ]
}
```

### 快速除錯 SQL

```sql
-- 檢查 google_tokens
SELECT
  user_id,
  scope,
  access_token_expires_at,
  created_at
FROM google_tokens;

-- 檢查 oauth_states
SELECT
  state,
  expires_at,
  created_at
FROM oauth_states
WHERE expires_at > NOW();

-- 清理過期 states
DELETE FROM oauth_states WHERE expires_at < NOW();
```

---

**快速開始指南版本**: 1.0
**最後更新**: 2026-01-19
**預估完成時間**: 30 分鐘

Happy Coding! 🚀

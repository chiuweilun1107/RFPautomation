# 安全指南

## 🚨 緊急安全問題

### 當前暴露的密鑰

在 `frontend/.env.local` 中發現以下敏感密鑰：

1. **SUPABASE_SERVICE_ROLE_KEY** - 具有完整數據庫管理權限
2. **OPENAI_API_KEY** - OpenAI API 訪問權限
3. **GOOGLE_GEMINI_API_KEY** - Google Gemini API 訪問權限

### ⚠️ 立即行動清單

#### 1. 輪換所有暴露的密鑰（最高優先級）

##### 1.1 Supabase Service Role Key

```bash
# 步驟：
# 1. 前往 Supabase Dashboard
#    https://app.supabase.com/project/YOUR_PROJECT/settings/api
#
# 2. 點擊 "Reset service_role secret"
# 3. 複製新的密鑰
# 4. 更新 frontend/.env.local
# 5. 重新啟動應用
```

**風險等級：🔴 嚴重**
- 暴露此密鑰等同於給予攻擊者完整的數據庫訪問權限
- 可繞過所有 Row Level Security (RLS) 策略
- 可讀取、修改、刪除所有數據

##### 1.2 OpenAI API Key

```bash
# 步驟：
# 1. 前往 OpenAI Platform
#    https://platform.openai.com/api-keys
#
# 2. 點擊舊密鑰旁的 "Revoke"
# 3. 點擊 "Create new secret key"
# 4. 複製新密鑰
# 5. 更新 frontend/.env.local
```

**風險等級：🟠 高**
- 暴露可能導致 API 濫用和高額費用
- 建議設置使用限制和預算警報

##### 1.3 Google Gemini API Key

```bash
# 步驟：
# 1. 前往 Google Cloud Console
#    https://console.cloud.google.com/apis/credentials
#
# 2. 找到暴露的 API 密鑰
# 3. 點擊 "Delete" 或 "Regenerate"
# 4. 創建新密鑰
# 5. 更新 frontend/.env.local
```

**風險等級：🟠 高**
- 可能導致配額濫用和費用

---

#### 2. 檢查 Git 歷史（確認未提交）

```bash
# 檢查 .env.local 是否曾被提交
cd "/Users/chiuyongren/Desktop/AI dev"
git log --all --full-history -- "frontend/.env.local"

# 如果有輸出，則需要清理歷史（危險操作，建議備份）
```

**✅ 好消息：** 經檢查，`.env.local` 未被提交到 git 歷史。

---

#### 3. 啟用環境變數驗證

已創建 `frontend/src/lib/env-validator.ts` 用於：
- 啟動時驗證必需的環境變數
- 防止私有密鑰在客戶端暴露
- 提供清晰的錯誤訊息

**使用方法：**

```typescript
// 在 frontend/src/app/layout.tsx 中添加
import { validateEnv } from '@/lib/env-validator';

// 在組件外部調用（服務端）
validateEnv();

export default function RootLayout({ children }) {
  // ...
}
```

---

## 🛡️ 安全最佳實踐

### 1. 環境變數管理

#### 1.1 使用正確的前綴

```bash
# ✅ 公開變數（可在客戶端使用）
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ 私有變數（僅服務端使用）
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIza...

# ❌ 錯誤：私有密鑰使用 NEXT_PUBLIC_ 前綴
NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # 將暴露在客戶端！
```

#### 1.2 安全的 API 密鑰訪問

```typescript
// ❌ 錯誤：直接訪問
const apiKey = process.env.OPENAI_API_KEY;

// ✅ 正確：使用安全包裝器
import { getOpenAIKey } from '@/lib/env-validator';

export async function POST(request: Request) {
  // 自動檢查是否在服務端
  const apiKey = getOpenAIKey();
  // ...
}
```

---

### 2. API Route 安全

#### 2.1 僅在服務端使用敏感密鑰

```typescript
// frontend/src/app/api/chat/route.ts
import { getOpenAIKey } from '@/lib/env-validator';

export async function POST(request: Request) {
  // ✅ 正確：僅在服務端訪問
  const apiKey = getOpenAIKey();

  // 調用 OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  return Response.json(await response.json());
}
```

#### 2.2 添加速率限制

```typescript
// frontend/src/lib/rate-limiter.ts
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
});

export async function checkRateLimit(userId: string): Promise<boolean> {
  return await limiter.removeTokens(1);
}
```

---

### 3. Supabase 安全

#### 3.1 使用 Row Level Security (RLS)

```sql
-- 為所有表啟用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 僅允許用戶訪問自己的項目
CREATE POLICY "Users can only access their own projects"
ON projects
FOR ALL
USING (auth.uid() = owner_id);
```

#### 3.2 僅在必要時使用 Service Role Key

```typescript
// ❌ 錯誤：在客戶端組件使用 Service Role
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ 正確：在客戶端使用 Anon Key（受 RLS 保護）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ✅ 正確：僅在 API Route 使用 Service Role（繞過 RLS）
import { getSupabaseServiceRoleKey } from '@/lib/env-validator';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabaseServiceRoleKey()
  );
  // ...
}
```

---

### 4. Git 安全

#### 4.1 確保 .gitignore 正確配置

```bash
# frontend/.gitignore
.env*
!.env.example  # 可以提交範例文件
```

#### 4.2 使用 git-secrets 防止意外提交

```bash
# 安裝 git-secrets
brew install git-secrets  # macOS
# 或
sudo apt-get install git-secrets  # Linux

# 配置
cd "/Users/chiuyongren/Desktop/AI dev"
git secrets --install
git secrets --register-aws

# 添加自定義規則
git secrets --add 'SUPABASE_SERVICE_ROLE_KEY=.*'
git secrets --add 'OPENAI_API_KEY=.*'
git secrets --add 'GOOGLE_GEMINI_API_KEY=.*'
```

---

## 📋 安全檢查清單

### 啟動前檢查

- [ ] 所有暴露的密鑰已輪換
- [ ] `.env.local` 在 `.gitignore` 中
- [ ] 已創建 `.env.example` 文件（不含真實密鑰）
- [ ] 環境變數驗證已啟用（`validateEnv()`）
- [ ] 所有私有密鑰僅在服務端使用

### 開發時檢查

- [ ] 沒有在客戶端組件使用 Service Role Key
- [ ] API Routes 有適當的速率限制
- [ ] 所有敏感操作都在服務端執行
- [ ] 使用 `getEnvVar()` 等安全包裝器訪問環境變數

### 部署前檢查

- [ ] 生產環境使用不同的密鑰
- [ ] 啟用 Supabase RLS
- [ ] 設置 API 使用限制和預算警報
- [ ] 運行安全掃描（`npm audit`）

---

## 🔧 自動化安全工具

### 1. 安裝依賴

```bash
cd "/Users/chiuyongren/Desktop/AI dev/frontend"

# 安裝安全掃描工具
npm install -D @next/eslint-plugin-next eslint-plugin-security

# 添加到 ESLint 配置
```

### 2. ESLint 安全規則

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:security/recommended"
  ],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

---

## 📞 安全事件響應

如果發現密鑰已被暴露或濫用：

1. **立即輪換所有密鑰**
2. **檢查 API 使用記錄**（尋找異常活動）
3. **審查數據訪問日誌**（Supabase Dashboard → Logs）
4. **通知團隊成員**
5. **更新此文檔**

---

## 📚 參考資源

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

**最後更新：2026-01-17**
**負責人：Ava（前端設計工程師）**

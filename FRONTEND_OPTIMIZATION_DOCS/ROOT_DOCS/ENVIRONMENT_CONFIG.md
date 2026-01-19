# 環境配置和敏感文件管理

## ⚠️ 重要安全提示

本文件說明如何正確管理環境變數和敏感密鑰。**請勿將實際密鑰提交到 git**。

## 📋 敏感文件位置

### 發現的敏感文件

| 文件 | 位置 | 狀態 | 行動 |
|------|------|------|------|
| `.env.local` | `frontend/` | ⚠️ 敏感 | 已在 .gitignore |
| `.env` | 根目錄 | ⚠️ 敏感 | 已在 .gitignore |
| `.env.docker` | 根目錄 | ⚠️ 敏感 | 已在 .gitignore |
| `creds_import.json` | `backend/` | ⚠️ 敏感 | **需檢查** |
| `n8n_cloud_key` | 根目錄 | ⚠️ 敏感 | **需檢查** |
| `.env.example` | `frontend/` 等 | ✅ 安全 | 保留（參考用） |

## 🔒 敏感文件清單

### frontend/.env.local（已暴露，需立即輪換）

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        ⚠️ 服務端密鑰，不應在客戶端
OPENAI_API_KEY=...                   ⚠️ API 密鑰已暴露
GOOGLE_GEMINI_API_KEY=...            ⚠️ API 密鑰已暴露
```

**立即行動**：見 [SECURITY.md](SECURITY.md) 的密鑰輪換指南

### backend/creds_import.json

包含敏感的 n8n 認證信息。

**檢查項**：
- [ ] 確認已在 .gitignore
- [ ] 不在任何提交中
- [ ] 只在本地 CI/CD 安全地使用

### n8n_cloud_key

n8n 雲端 API 密鑰。

**檢查項**：
- [ ] 確認已在 .gitignore
- [ ] 安全地存儲（使用 secrets manager）
- [ ] 定期輪換

## ✅ 環境變數驗證系統

已實現的驗證機制：

```typescript
// frontend/src/lib/env-validator.ts

export function validateEnv() {
  // 自動驗證必需的環境變數
  // 防止敏感密鑰暴露
  // 啟動時運行
}
```

**如何啟用**：
```typescript
// frontend/src/app/layout.tsx
import { validateEnv } from '@/lib/env-validator';

validateEnv();
```

## 📝 環境變數分類

### 公開變數（可提交到 git）

```env
# 前綴 NEXT_PUBLIC_ - 暴露給客戶端
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
NEXT_PUBLIC_APP_ENV=production
```

### 私有變數（絕不提交）

```env
# 服務端密鑰
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

## 🛡️ 最佳實踐

### 1️⃣ 本地開發

```bash
# 創建 .env.local（已在 .gitignore）
cp frontend/.env.example frontend/.env.local

# 編輯 .env.local 添加實際密鑰
# 絕不提交這個文件
```

### 2️⃣ 部署到生產

```bash
# 使用環境變數或 secrets manager
# 不要在代碼中硬編碼
# 不要提交 .env 文件

# 推薦工具：
# - Docker secrets
# - Kubernetes secrets
# - AWS Secrets Manager
# - Vercel Environment Variables
# - GitHub Secrets
```

### 3️⃣ CI/CD 流程

```yaml
# GitHub Actions 示例
- name: Build
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  run: npm run build
```

## 📋 檢查清單

### 安全檢查

- [ ] `.env.local` 在 `.gitignore`
- [ ] `.env` 在 `.gitignore`
- [ ] `creds_import.json` 在 `.gitignore`
- [ ] `n8n_cloud_key` 在 `.gitignore`
- [ ] 沒有提交過敏感文件
- [ ] API 密鑰已輪換
- [ ] 使用環境變數驗證系統
- [ ] 生產密鑰使用 secrets manager

### 密鑰輪換

- [ ] Supabase Service Role Key ✅ 已標記待輪換
- [ ] OpenAI API Key ✅ 已標記待輪換
- [ ] Google Gemini API Key ✅ 已標記待輪換
- [ ] n8n Cloud Key ✅ 需檢查
- [ ] 數據庫連接字符串 ⏳ 評估中
- [ ] JWT Secret ⏳ 評估中

## 🔧 故障排除

### 問題：本地開發沒有 API 密鑰

**解決方案**：
```bash
# 1. 創建 .env.local
cp frontend/.env.example frontend/.env.local

# 2. 從 1Password/安全存儲獲取密鑰
# 3. 複製到 .env.local

# 4. 驗證
npm run validate-env
```

### 問題：CI/CD 構建失敗

**解決方案**：
1. 檢查 GitHub Secrets 是否已設置
2. 確認環境變數名稱正確
3. 驗證 secret 值沒有多餘空格
4. 查看 CI/CD 日誌獲取詳細錯誤

### 問題：應用程序崩潰因為缺少 API 密鑰

**解決方案**：
1. 運行 `npm run validate-env`
2. 檢查 `.env.local` 是否存在
3. 驗證所有必需的密鑰都已設置
4. 查看控制台錯誤消息

## 📚 參考資源

### 官方指南
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Project Configuration](https://supabase.com/docs/guides/self-hosting)
- [OpenAI API Keys](https://platform.openai.com/docs/api-reference/authentication)

### 工具
- [1Password](https://1password.com/) - 密碼管理
- [git-secrets](https://github.com/awslabs/git-secrets) - 防止秘密提交
- [TruffleHog](https://www.trufflesecurity.com/trufflehog) - 檢測洩露的密鑰

---

## 相關文檔

- [SECURITY.md](SECURITY.md) - 密鑰輪換指南
- [frontend/src/lib/env-validator.ts](../../../frontend/src/lib/env-validator.ts) - 驗證實現

---

**最後更新**：2026-01-17
**優先級**：🔴 P0 - 安全關鍵

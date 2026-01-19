# 🔒 安全檢查清單

## 敏感文件狀態

### ⚠️ 需要立即檢查的文件

- [ ] `frontend/.env.local` - **已暴露的密鑰，需輪換**
  - SUPABASE_SERVICE_ROLE_KEY
  - OPENAI_API_KEY
  - GOOGLE_GEMINI_API_KEY

- [ ] `backend/creds_import.json` - **確認已在 .gitignore**
  
- [ ] `n8n_cloud_key` - **確認已在 .gitignore**

### ✅ 安全狀態

- [x] `frontend/.env` - 已在 .gitignore
- [x] 根目錄 `.env` - 已在 .gitignore
- [x] 根目錄 `.env.docker` - 已在 .gitignore
- [x] 環境變數驗證系統已部署 (`env-validator.ts`)

## 🚨 P0 優先級行動項

### 立即（今天）

```bash
# 1. 輪換所有 API 密鑰（見 SECURITY.md）
# 2. 驗證敏感文件不在 git 中
# 3. 啟用環境變數驗證
```

### 本周

```bash
# 1. 檢查 CI/CD 密鑰是否正確設置
# 2. 更新生產環境變數
# 3. 審計 git 歷史中的密鑰暴露
```

## 📋 驗證步驟

```bash
# 1. 檢查 .gitignore
grep -E "\.env|creds|key|secret" .gitignore

# 2. 驗證敏感文件未提交
git log -S "OPENAI_API_KEY" --oneline

# 3. 執行環境驗證
npm run validate-env

# 4. 使用工具檢查洩露的密鑰
git-secrets --scan
```

## 🎯 相關文檔

- [SECURITY.md](SECURITY.md) - 密鑰輪換指南
- [ENVIRONMENT_CONFIG.md](ENVIRONMENT_CONFIG.md) - 環境配置詳情

---

**優先級**: 🔴 P0 - 安全關鍵  
**狀態**: ⏳ 待檢查和輪換

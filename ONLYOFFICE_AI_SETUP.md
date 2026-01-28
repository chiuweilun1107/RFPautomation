# OnlyOffice AI 功能設置指南

## 📖 概述

本系統已整合 OnlyOffice 編輯器的 AI 功能，使用 **Azure OpenAI GPT-4** 提供智能文檔輔助。

### 主要功能

- ✨ **文本生成**：根據提示生成段落、章節內容
- ✨ **文本改寫**：重新表述選中的文本，改善表達
- ✨ **內容總結**：自動總結長篇文本
- ✨ **翻譯**：多語言翻譯支持
- ✨ **語法檢查**：檢查並修正語法錯誤
- ✨ **格式優化**：改善文檔結構和格式

---

## 🏗️ 技術架構

```
前端 OnlyOffice 編輯器
    ↓
API 代理層 (/api/ai-proxy/azure-openai)
    ├─ Supabase 用戶認證
    ├─ 速率限制（每用戶每分鐘 20 次）
    └─ 從環境變數安全讀取 API 密鑰
    ↓
Azure OpenAI GPT-4.1
```

### 安全特性

- 🔒 **API 密鑰保護**：密鑰僅存在於伺服器端環境變數，不暴露到前端
- 🔒 **用戶認證**：所有 AI 請求需通過 Supabase 認證
- 🔒 **速率限制**：防止濫用，每用戶每分鐘最多 20 次請求
- 🔒 **完整日誌**：記錄所有 AI API 調用以便監控

---

## 🚀 快速開始

### 第一步：安裝 OnlyOffice AI 插件

1. 打開任意文檔編輯器（進入模板管理 → 選擇任意模板 → 點擊「編輯」）

2. 在編輯器頂部工具欄，點擊「插件」圖標（拼圖圖示）

3. 在插件管理器中，找到「AI Helper」或「ChatGPT」插件

4. 點擊「安裝」（Install）

5. 安裝完成後，插件圖標會出現在工具欄右側

### 第二步：配置自定義 AI 提供商

由於我們使用自己的 Azure OpenAI 後端，需要配置自定義提供商：

1. 點擊工具欄的 AI 插件圖標

2. 在 AI 面板中，點擊「設置」（Settings）或齒輪圖標

3. 選擇「Add Custom Provider」（添加自定義提供商）

4. 填寫以下配置：

   | 欄位 | 值 |
   |------|-----|
   | **Provider Name** | Azure OpenAI (Proxy) |
   | **API URL** | `https://your-domain.com/api/ai-proxy/azure-openai` |
   | **API Key** | `proxy-managed` (任意值，實際由後端管理) |
   | **Model** | `gpt-4` |

   > **注意**：將 `your-domain.com` 替換為實際的網域名稱（生產環境）或 `localhost:3000`（開發環境）

5. 點擊「保存」

6. 在 AI 提供商列表中選擇「Azure OpenAI (Proxy)」作為默認提供商

### 第三步：開始使用

1. **文本生成**
   - 在文檔中輸入提示詞，例如：「請撰寫一段關於數位轉型的介紹」
   - 選中這段文字
   - 點擊 AI 插件圖標
   - 選擇「Generate」

2. **文本改寫**
   - 選中需要改寫的段落
   - 點擊 AI 插件
   - 選擇「Rewrite」或「Improve」

3. **內容總結**
   - 選中長篇文本
   - 點擊 AI 插件
   - 選擇「Summarize」

4. **翻譯**
   - 選中文本
   - 點擊 AI 插件
   - 選擇「Translate to...」並選擇目標語言

---

## ⚙️ 環境配置

### 環境變數

系統已在 `.env.local` 中配置以下變數：

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://ocrgpt4.openai.azure.com
AZURE_OPENAI_KEY=ba6946b167174ece95e7419976aa6a33
AZURE_OPENAI_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

### OnlyOffice 編輯器配置

已在 `OnlyOfficeEditorWithUpload.tsx` 中啟用插件支持：

```typescript
customization: {
  plugins: true, // 啟用插件支持
}
```

---

## 🔧 API 端點詳情

### POST /api/ai-proxy/azure-openai

**用途**：代理 AI 請求到 Azure OpenAI

**請求格式**：

```json
{
  "messages": [
    { "role": "user", "content": "請撰寫一段關於AI的介紹" }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**回應格式**（符合 OpenAI API 標準）：

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI（人工智能）是..."
      }
    }
  ]
}
```

**錯誤處理**：

| 狀態碼 | 原因 | 解決方案 |
|--------|------|----------|
| 401 | 未登入 | 請先登入系統 |
| 429 | 超過速率限制 | 請稍後再試（每分鐘最多 20 次） |
| 500 | Azure OpenAI 配置錯誤 | 檢查環境變數 |

---

## 📊 使用限制

### 速率限制

- **每用戶每分鐘**：最多 20 次 AI 請求
- 超過限制會收到 `429 Too Many Requests` 錯誤
- 計數器每 60 秒自動重置

### 內容限制

- **最大輸入長度**：約 8000 字（GPT-4 token 限制）
- **最大輸出長度**：1000 tokens（可在 API 中調整 `max_tokens`）

---

## 🐛 故障排除

### 問題 1：AI 插件圖標未出現

**可能原因**：
- 插件未安裝
- 編輯器配置未啟用插件

**解決方案**：
1. 確認 `customization.plugins: true` 已設置
2. 重新載入頁面
3. 前往插件管理器手動安裝

### 問題 2：AI 請求失敗（401 錯誤）

**可能原因**：用戶未登入

**解決方案**：
1. 確認已登入系統
2. 檢查瀏覽器 DevTools → Application → Cookies，確認 Supabase session 存在
3. 嘗試重新登入

### 問題 3：AI 請求失敗（429 錯誤）

**可能原因**：超過速率限制

**解決方案**：
1. 等待 1 分鐘後重試
2. 減少 AI 請求頻率

### 問題 4：AI 請求失敗（500 錯誤）

**可能原因**：Azure OpenAI 配置錯誤

**解決方案**：
1. 檢查 `.env.local` 中的配置是否正確
2. 確認 `AZURE_OPENAI_KEY` 有效
3. 查看伺服器日誌（`console.log`）獲取詳細錯誤信息

### 問題 5：自定義提供商無法保存

**可能原因**：OnlyOffice 版本過舊

**解決方案**：
1. 確認 OnlyOffice Document Server 版本 ≥ 9.0.4
2. 升級 OnlyOffice（如需要）

---

## 📈 監控與日誌

### 查看 API 調用日誌

在開發環境中，所有 AI 請求都會記錄到控制台：

```bash
# 啟動開發伺服器
npm run dev

# 查看日誌
# [AI Proxy] Request from user: xxx-xxx-xxx Messages: 2
# [AI Proxy] Azure OpenAI response received
```

### 監控速率限制

API 回應包含速率限制 headers：

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
```

可在瀏覽器 DevTools → Network → 查看回應 headers

---

## 🔄 未來擴展

### 切換到其他 AI 提供商

如需使用其他 AI 服務（如 OpenAI、Gemini），可以：

1. 創建新的 API 代理（例如：`/api/ai-proxy/openai`）
2. 複製 `azure-openai/route.ts` 的結構
3. 修改 API 調用邏輯
4. 在編輯器中添加對應的自定義提供商

### 使用 Redis 進行速率限制

當前使用記憶體存儲，在多伺服器環境中可能不一致。可切換到 Redis：

1. 修改 `lib/rate-limiter.ts`
2. 使用 `ioredis` 連接到 Redis
3. 將計數存儲在 Redis 中

---

## 📞 技術支援

如遇問題，請檢查：

1. **瀏覽器控制台**：查看前端錯誤
2. **伺服器日誌**：查看 API 錯誤（`npm run dev` 輸出）
3. **環境變數**：確認所有必要配置已設置
4. **OnlyOffice 版本**：確保 ≥ 9.0.4

---

## 📚 參考資源

- [OnlyOffice AI Plugin 官方文檔](https://api.onlyoffice.com/docs/plugin-and-macros/samples/plugin-samples/ai/)
- [Azure OpenAI API 文檔](https://learn.microsoft.com/azure/ai-services/openai/)
- [OnlyOffice Document Server](https://www.onlyoffice.com/)

---

**最後更新**：2026-01-28

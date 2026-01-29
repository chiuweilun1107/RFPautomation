# OnlyOffice AI 自動配置使用指南

## ✅ 已完成的工作

系統已實施 OnlyOffice AI 自動配置功能，現在編輯器會在加載時自動嘗試配置 AI 提供商。

---

## 🎯 自動配置機制

### 配置方式

系統使用**多重配置策略**來確保 AI 功能可用：

1. **方法 1：通過 OnlyOffice API**
   - 嘗試調用 `Asc.plugin.executeMethod('AddAIProvider')`
   - 直接向插件註冊 AI 提供商

2. **方法 2：通過 localStorage**
   - 在多個可能的 storage keys 中保存配置
   - 包括：`onlyoffice_ai_providers`、`asc.ai.providers`、`ai_providers`

3. **方法 3：通過公共腳本**
   - 加載 `/onlyoffice-ai-auto-config.js`
   - 在瀏覽器環境中執行配置邏輯

### 配置內容

自動配置會設置以下 AI 提供商：

```json
{
  "name": "Azure OpenAI",
  "baseUrl": "[當前域名]/api/ai-proxy/azure-openai",
  "apiKey": "proxy-managed",
  "model": "gpt-4",
  "defaultModel": "gpt-4"
}
```

**重要**：`baseUrl` 會根據當前環境自動調整：
- 開發環境：`http://localhost:3000/api/ai-proxy/azure-openai`
- 生產環境：`https://editor.decaza.org/api/ai-proxy/azure-openai`

---

## 🚀 使用步驟

### 步驟 1：重啟開發伺服器（如果正在運行）

```bash
cd frontend
# 停止伺服器 (Ctrl+C)
npm run dev
```

### 步驟 2：打開編輯器

1. 訪問任意模板編輯頁面
2. 等待編輯器加載完成
3. 打開瀏覽器控制台（F12）

### 步驟 3：查看自動配置日誌

在控制台中，你應該會看到：

```
═══════════════════════════════════════════
  OnlyOffice AI 自動配置
═══════════════════════════════════════════
提供商: Azure OpenAI
API URL: https://editor.decaza.org/api/ai-proxy/azure-openai
模型: gpt-4
═══════════════════════════════════════════
✅ 通過 localStorage 配置成功
═══════════════════════════════════════════
```

### 步驟 4：測試 AI 功能

1. 點擊 AI 插件圖標
2. **如果看到「AI 配置」對話框**：
   - 這表示需要選擇模型
   - 在每個下拉選單中選擇 `gpt-4`
   - 點擊「確定」

3. **如果直接進入 AI 面板**：
   - 恭喜！自動配置成功
   - 可以直接使用 AI 功能

4. 在文檔中輸入文字，選中後使用 AI 功能測試

---

## 🔍 故障排除

### 問題 1：控制台沒有顯示自動配置日誌

**可能原因**：腳本未正確載入

**解決方案**：
1. 檢查瀏覽器控制台是否有錯誤
2. 確認 `/onlyoffice-ai-auto-config.js` 可訪問：
   ```
   http://localhost:3000/onlyoffice-ai-auto-config.js
   ```
3. 清除瀏覽器快取並重新載入

### 問題 2：顯示「⚠️ 自動配置未成功」

**可能原因**：OnlyOffice AI 插件未安裝或 API 不可用

**解決方案**：
1. 確認 AI 插件已安裝（工具欄應該有 AI 圖標）
2. 如果未安裝，前往插件管理器安裝「AI Helper」或「ChatGPT」
3. 安裝後重新載入編輯器

### 問題 3：AI 配置對話框中下拉選單為空

**可能原因**：配置未成功保存或格式不正確

**解決方案**：
1. 關閉對話框
2. 點擊「編輯 AI 模型」
3. 手動添加模型：
   - 名稱：`OpenAI`
   - URL：`https://editor.decaza.org/api/ai-proxy/azure-openai`（從控制台複製）
   - 密鑰：`proxy-managed`
   - 點擊「更新模型列表」
   - 選擇 `gpt-4`

### 問題 4：每次打開編輯器都要重新配置

**可能原因**：瀏覽器禁用了 localStorage 或每次清除快取

**解決方案**：
1. 檢查瀏覽器設置，允許 localStorage
2. 不要在「退出時清除 Cookie 和網站資料」
3. 嘗試使用無痕模式測試（如果無痕模式下正常，則是瀏覽器設置問題）

---

## 📊 技術細節

### 檔案結構

```
frontend/
├── public/
│   └── onlyoffice-ai-auto-config.js    # 公共配置腳本
├── src/
│   ├── lib/
│   │   ├── onlyoffice-ai-config.ts     # AI 配置工具（舊版）
│   │   └── onlyoffice-ai-helper.ts     # AI 配置輔助函數（新版）
│   └── components/
│       └── templates/
│           └── OnlyOfficeEditorWithUpload.tsx  # 編輯器組件
└── src/app/api/
    └── ai-proxy/
        └── azure-openai/
            ├── route.ts           # 聊天 API 代理
            └── models/
                └── route.ts       # 模型列表 API
```

### 配置執行流程

```
1. 用戶打開編輯器
   ↓
2. 加載 OnlyOffice API Script
   ↓
3. 加載 AI 自動配置腳本 (onlyoffice-ai-auto-config.js)
   ↓
4. 編輯器觸發 onDocumentReady 事件
   ↓
5. 調用 scheduleAIConfiguration(2000)
   ↓
6. 2 秒後執行 autoConfigureAI()
   ↓
7. 嘗試通過 API 配置（方法 1）
   ↓
8. 嘗試通過 localStorage 配置（方法 2）
   ↓
9. 輸出配置結果到控制台
```

### localStorage 數據格式

```json
[
  {
    "name": "Azure OpenAI",
    "baseUrl": "https://editor.decaza.org/api/ai-proxy/azure-openai",
    "apiKey": "proxy-managed",
    "models": ["gpt-4"],
    "defaultModel": "gpt-4",
    "autoConfigured": true,
    "configuredAt": "2026-01-29T03:21:00.000Z"
  }
]
```

---

## 🎓 進階配置

### 自定義配置延遲

如果需要調整自動配置的延遲時間，修改：

```typescript
// OnlyOfficeEditorWithUpload.tsx
scheduleAIConfiguration(2000);  // 改為你需要的毫秒數
```

### 添加更多 AI 模型

修改 `onlyoffice-ai-helper.ts` 中的配置：

```typescript
export function getAIProviderConfig(): AIProviderConfig {
  return {
    name: 'Azure OpenAI',
    baseUrl: getAIApiUrl(),
    apiKey: 'proxy-managed',
    model: 'gpt-4',  // 可以改為其他模型
    modelDisplayName: 'GPT-4',
  };
}
```

### 禁用自動配置

如果需要禁用自動配置，註釋掉以下行：

```typescript
// OnlyOfficeEditorWithUpload.tsx, onDocumentReady 事件中
// scheduleAIConfiguration(2000);
```

---

## 📝 測試檢查清單

完成以下測試，確保自動配置正常：

### 開發環境測試
- [ ] 重啟開發伺服器
- [ ] 打開編輯器
- [ ] 控制台顯示自動配置日誌
- [ ] 點擊 AI 插件
- [ ] 在 AI 配置中看到 `gpt-4` 選項
- [ ] 選擇模型後能成功使用 AI 功能

### 生產環境測試
- [ ] 部署到生產環境
- [ ] 訪問 `https://editor.decaza.org`
- [ ] 打開編輯器
- [ ] 控制台顯示正確的生產環境 URL
- [ ] AI 功能正常使用

### 跨瀏覽器測試
- [ ] Chrome 測試
- [ ] Firefox 測試
- [ ] Safari 測試
- [ ] Edge 測試

---

## 🔄 更新歷程

- **2026-01-29**: 實施自動配置方案
  - 創建 `onlyoffice-ai-auto-config.js`
  - 創建 `onlyoffice-ai-helper.ts`
  - 修改編輯器組件添加自動配置調用
  - 添加多重配置策略

---

## 📞 支援

如果遇到問題：
1. 查看控制台日誌
2. 檢查本文檔的故障排除章節
3. 確認 API 端點可訪問（`/api/ai-proxy/azure-openai`）
4. 確認環境變數配置正確（`.env.local`）

---

**最後更新**：2026-01-29

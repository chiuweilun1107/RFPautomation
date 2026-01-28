/**
 * OnlyOffice AI 配置助手
 *
 * 根據當前環境自動生成正確的 AI API 端點
 */

/**
 * 獲取 AI 代理 API 端點
 * 自動根據當前環境（開發/生產）選擇正確的 URL
 */
export function getAIProxyUrl(): string {
  // 在瀏覽器環境中
  if (typeof window !== 'undefined') {
    // 使用當前頁面的 origin（自動匹配 HTTP/HTTPS 和域名）
    return `${window.location.origin}/api/ai-proxy/azure-openai`;
  }

  // 伺服器端渲染時的備用值
  return process.env.NEXT_PUBLIC_AI_PROXY_URL || 'http://localhost:3000/api/ai-proxy/azure-openai';
}

/**
 * 獲取 AI 提供商配置（用於 OnlyOffice AI 插件）
 */
export function getAIProviderConfig() {
  return {
    name: 'Azure OpenAI',
    displayName: 'Azure OpenAI (代理)',
    baseUrl: getAIProxyUrl(),
    apiKey: 'proxy-managed', // 由後端管理
    models: ['gpt-4'],
    defaultModel: 'gpt-4',
  };
}

/**
 * 生成 OnlyOffice AI 插件配置指南文本
 */
export function getAIConfigInstructions(): string {
  const apiUrl = getAIProxyUrl();

  return `
OnlyOffice AI 插件配置：

1. 點擊 AI 插件圖標（或從插件管理器安裝 AI Helper）
2. 打開設置（Settings）
3. 選擇「添加 AI 模型」
4. 填寫以下信息：

   權限名稱: Azure OpenAI
   提供商: OpenAI
   URL: ${apiUrl}
   密鑰: proxy-managed
   模型: gpt-4

5. 勾選「處理文本」
6. 點擊「確定」保存

提示：URL 會根據當前環境自動調整（開發/生產）
`.trim();
}

/**
 * 在控制台輸出配置信息（用於調試）
 */
export function logAIConfig() {
  if (typeof window !== 'undefined') {
    console.log('═══════════════════════════════════════════');
    console.log('OnlyOffice AI 配置信息');
    console.log('═══════════════════════════════════════════');
    console.log('API 端點:', getAIProxyUrl());
    console.log('環境:', process.env.NODE_ENV);
    console.log('Origin:', window.location.origin);
    console.log('\n複製以下 URL 到 AI 插件配置：');
    console.log(getAIProxyUrl());
    console.log('═══════════════════════════════════════════');
  }
}

/**
 * Azure OpenAI 自定義提供商配置
 * 通過本地代理安全連接到 Azure OpenAI GPT-4
 */

// 定義 AI 提供商配置
window.AIProviderConfig = {
  // 提供商基本信息
  name: "Azure OpenAI",
  displayName: "Azure OpenAI (代理)",
  description: "通過本地代理連接的 Azure OpenAI GPT-4",

  // API 配置
  baseUrl: "http://localhost:3000/api/ai-proxy/azure-openai",
  apiKey: "proxy-managed",

  // 模型配置
  models: [
    {
      id: "gpt-4",
      name: "GPT-4",
      displayName: "GPT-4",
      description: "最強大的 GPT-4 模型",
      capabilities: {
        chat: true,
        completion: true,
        text: true,
        embedding: false,
        image: false
      }
    }
  ],

  // 默認設置
  defaultModel: "gpt-4",
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000
};

/**
 * OnlyOffice AI 配置輔助函數
 *
 * 提供在編輯器初始化後自動配置 AI 的方法
 */

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  modelDisplayName?: string;
}

/**
 * 獲取當前環境的 AI API URL
 */
export function getAIApiUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/ai-proxy/azure-openai`;
  }
  return '/api/ai-proxy/azure-openai';
}

/**
 * 獲取 AI 提供商配置
 */
export function getAIProviderConfig(): AIProviderConfig {
  return {
    name: 'Azure OpenAI',
    baseUrl: getAIApiUrl(),
    apiKey: 'proxy-managed',
    model: 'gpt-4',
    modelDisplayName: 'GPT-4',
  };
}

/**
 * 嘗試通過 localStorage 配置 AI 提供商
 */
export function configureAIViaLocalStorage(config: AIProviderConfig): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const storageKeys = [
      'onlyoffice_ai_providers',
      'asc.ai.providers',
      'ai_providers',
    ];

    let configured = false;

    storageKeys.forEach((key) => {
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');

        // 檢查是否已存在
        const alreadyExists = existing.some(
          (p: any) => p.baseUrl === config.baseUrl || p.name === config.name
        );

        if (!alreadyExists) {
          existing.push({
            name: config.name,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            models: [config.model],
            defaultModel: config.model,
            autoConfigured: true,
            configuredAt: new Date().toISOString(),
          });

          localStorage.setItem(key, JSON.stringify(existing));
          configured = true;
        }
      } catch {
        // 忽略單個 key 的錯誤
      }
    });

    return configured;
  } catch {
    return false;
  }
}

/**
 * 嘗試通過 OnlyOffice API 配置 AI 提供商
 */
export function configureAIViaAPI(config: AIProviderConfig): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const win = window as any;

    // 檢查各種可能的 API 入口
    const apiPaths = [
      win.Asc?.plugin?.executeMethod,
      win.DocsAPI?.DocEditor?.prototype?.executeMethod,
      win.AscDesktopEditor?.executeMethod,
    ];

    for (const apiMethod of apiPaths) {
      if (typeof apiMethod === 'function') {
        try {
          apiMethod('AddAIProvider', [config], () => {
            // 靜默處理結果
          });
          return true;
        } catch {
          // 靜默失敗，嘗試下一個方法
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * 自動配置 AI 提供商（嘗試所有可用方法）
 */
export function autoConfigureAI(): void {
  const config = getAIProviderConfig();

  // 嘗試方法 1: API
  configureAIViaAPI(config);

  // 嘗試方法 2: localStorage
  configureAIViaLocalStorage(config);
}

/**
 * 在編輯器就緒後延遲執行配置
 */
export function scheduleAIConfiguration(delayMs: number = 2000): void {
  if (typeof window === 'undefined') {
    return;
  }

  setTimeout(() => {
    autoConfigureAI();
  }, delayMs);
}

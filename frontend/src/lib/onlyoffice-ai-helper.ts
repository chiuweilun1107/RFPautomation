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
          console.log(`[AI Helper] 已保存配置到 localStorage[${key}]`);
          configured = true;
        }
      } catch (err) {
        // 忽略單個 key 的錯誤
      }
    });

    return configured;
  } catch (error) {
    console.error('[AI Helper] localStorage 配置失敗:', error);
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
          apiMethod('AddAIProvider', [config], (result: any) => {
            if (result?.error) {
              console.warn('[AI Helper] API 配置失敗:', result.error);
            } else {
              console.log('[AI Helper] ✅ AI 提供商已通過 API 配置');
            }
          });
          return true;
        } catch (err) {
          console.warn('[AI Helper] API 調用失敗:', err);
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[AI Helper] API 配置失敗:', error);
    return false;
  }
}

/**
 * 自動配置 AI 提供商（嘗試所有可用方法）
 */
export function autoConfigureAI(): void {
  const config = getAIProviderConfig();

  console.log('═══════════════════════════════════════════');
  console.log('  OnlyOffice AI 自動配置');
  console.log('═══════════════════════════════════════════');
  console.log('提供商:', config.name);
  console.log('API URL:', config.baseUrl);
  console.log('模型:', config.model);
  console.log('═══════════════════════════════════════════');

  // 嘗試方法 1: API
  const apiSuccess = configureAIViaAPI(config);
  if (apiSuccess) {
    console.log('✅ 通過 API 配置成功');
  }

  // 嘗試方法 2: localStorage
  const storageSuccess = configureAIViaLocalStorage(config);
  if (storageSuccess) {
    console.log('✅ 通過 localStorage 配置成功');
  }

  if (!apiSuccess && !storageSuccess) {
    console.log('⚠️  自動配置未成功，請手動配置：');
    console.log('1. 點擊 AI 插件圖標');
    console.log('2. 打開設置 → 編輯 AI 模型');
    console.log('3. 添加模型：');
    console.log(`   - URL: ${config.baseUrl}`);
    console.log(`   - 密鑰: ${config.apiKey}`);
    console.log(`   - 模型: ${config.model}`);
  }

  console.log('═══════════════════════════════════════════\n');
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

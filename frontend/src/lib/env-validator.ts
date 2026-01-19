/**
 * 環境變數驗證工具
 *
 * 功能：
 * 1. 在應用啟動時驗證必需的環境變數
 * 2. 防止敏感密鑰在客戶端暴露
 * 3. 提供清晰的錯誤訊息
 */

// 必需的公開環境變數（可在客戶端使用）
const REQUIRED_PUBLIC_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// 必需的私有環境變數（僅服務端使用）
const REQUIRED_PRIVATE_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_GEMINI_API_KEY',
] as const;

// 可選的環境變數
const OPTIONAL_ENV_VARS = [
  'N8N_WEBHOOK_URL',
  'N8N_TEMPLATE_PARSE_WEBHOOK',
  'N8N_DOCUMENT_GENERATE_WEBHOOK',
  'N8N_INGEST_WEBHOOK',
  'N8N_WEBHOOK_TEXT_REMOVAL',
] as const;

interface ValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
}

/**
 * 驗證公開環境變數（客戶端安全）
 */
export function validatePublicEnv(): ValidationResult {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_PUBLIC_ENV_VARS) {
    if (!process.env[key]) {
      missingVars.push(key);
    }
  }

  // 檢查是否有私有密鑰被錯誤地使用 NEXT_PUBLIC_ 前綴
  const dangerousPublicVars = Object.keys(process.env).filter(
    (key) =>
      key.startsWith('NEXT_PUBLIC_') &&
      (key.includes('SECRET') ||
        key.includes('PRIVATE') ||
        key.includes('SERVICE_ROLE'))
  );

  if (dangerousPublicVars.length > 0) {
    warnings.push(
      `⚠️ 危險：以下環境變數使用了 NEXT_PUBLIC_ 前綴，將暴露在客戶端：\n  ${dangerousPublicVars.join('\n  ')}`
    );
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

/**
 * 驗證私有環境變數（僅服務端）
 */
export function validatePrivateEnv(): ValidationResult {
  // 僅在服務端執行
  if (typeof window !== 'undefined') {
    throw new Error('validatePrivateEnv() 只能在服務端調用');
  }

  const missingVars: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_PRIVATE_ENV_VARS) {
    if (!process.env[key]) {
      missingVars.push(key);
    }
  }

  // 檢查可選變數
  const missingOptionalVars = OPTIONAL_ENV_VARS.filter(
    (key) => !process.env[key]
  );
  if (missingOptionalVars.length > 0) {
    warnings.push(
      `ℹ️ 可選環境變數未設置（某些功能可能不可用）：\n  ${missingOptionalVars.join('\n  ')}`
    );
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

/**
 * 完整的環境變數驗證（啟動時調用）
 */
export function validateEnv(): void {
  const isServer = typeof window === 'undefined';

  // 驗證公開變數
  const publicResult = validatePublicEnv();

  if (!publicResult.isValid) {
    const error = new Error(
      `❌ 缺少必需的環境變數：\n  ${publicResult.missingVars.join('\n  ')}\n\n` +
      `請檢查 .env.local 文件並確保所有必需變數已設置。`
    );
    console.error(error.message);
    throw error;
  }

  // 顯示警告
  if (publicResult.warnings.length > 0) {
    publicResult.warnings.forEach((warning) => console.warn(warning));
  }

  // 服務端驗證私有變數
  if (isServer) {
    const privateResult = validatePrivateEnv();

    if (!privateResult.isValid) {
      const error = new Error(
        `❌ 缺少必需的私有環境變數：\n  ${privateResult.missingVars.join('\n  ')}\n\n` +
        `請檢查 .env.local 文件並確保所有必需變數已設置。`
      );
      console.error(error.message);
      throw error;
    }

    if (privateResult.warnings.length > 0) {
      privateResult.warnings.forEach((warning) => console.warn(warning));
    }
  }
}

/**
 * 獲取環境變數的安全包裝器
 * 防止在客戶端訪問私有密鑰
 */
export function getEnvVar(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`環境變數 ${key} 未設置`);
  }

  // 檢查是否在客戶端嘗試訪問私有變數
  if (typeof window !== 'undefined' && !key.startsWith('NEXT_PUBLIC_')) {
    throw new Error(
      `⚠️ 安全錯誤：嘗試在客戶端訪問私有環境變數 ${key}`
    );
  }

  return value;
}

/**
 * 安全地獲取 Supabase 服務角色密鑰（僅服務端）
 */
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase Service Role Key 只能在服務端使用');
  }
  return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * 安全地獲取 OpenAI API 密鑰（僅服務端）
 */
export function getOpenAIKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI API Key 只能在服務端使用');
  }
  return getEnvVar('OPENAI_API_KEY');
}

/**
 * 安全地獲取 Google Gemini API 密鑰（僅服務端）
 */
export function getGeminiKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Google Gemini API Key 只能在服務端使用');
  }
  return getEnvVar('GOOGLE_GEMINI_API_KEY');
}

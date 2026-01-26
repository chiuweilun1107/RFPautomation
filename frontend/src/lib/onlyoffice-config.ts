/**
 * OnlyOffice Document Server 配置
 *
 * 統一管理 OnlyOffice API URL，支援環境變數配置
 *
 * 環境變數配置（.env.local）:
 * NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org (生產)
 * NEXT_PUBLIC_ONLYOFFICE_API_URL=http://5.78.118.41:8080 (開發)
 */

/**
 * 獲取 OnlyOffice API 基礎 URL
 */
export function getOnlyOfficeApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://5.78.118.41:8080';

  // 移除尾部斜線
  return apiUrl.replace(/\/$/, '');
}

/**
 * 獲取 OnlyOffice API Script URL
 */
export function getOnlyOfficeApiScriptUrl(): string {
  return `${getOnlyOfficeApiUrl()}/web-apps/apps/api/documents/api.js`;
}

/**
 * 檢查是否使用 HTTPS
 */
export function isOnlyOfficeSecure(): boolean {
  return getOnlyOfficeApiUrl().startsWith('https://');
}

/**
 * 獲取環境標籤（用於 UI 顯示）
 */
export function getOnlyOfficeEnvironment(): 'production' | 'development' {
  return isOnlyOfficeSecure() ? 'production' : 'development';
}

/**
 * 獲取 OnlyOffice 配置摘要（用於調試）
 */
export function getOnlyOfficeConfigSummary() {
  const apiUrl = getOnlyOfficeApiUrl();
  const environment = getOnlyOfficeEnvironment();
  const isSecure = isOnlyOfficeSecure();

  return {
    apiUrl,
    scriptUrl: getOnlyOfficeApiScriptUrl(),
    environment,
    isSecure,
    protocol: isSecure ? 'HTTPS' : 'HTTP',
  };
}

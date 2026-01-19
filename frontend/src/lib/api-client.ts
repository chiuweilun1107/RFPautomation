/**
 * Type-Safe API Client
 * Centralized API client with error handling and retries
 */

import { ExternalApiError, ServiceUnavailableError } from './errors/AppError';
import { logger } from './errors/logger';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipErrorHandling?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode?: number;
    context?: Record<string, unknown>;
  };
}

class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 30000, // 30 seconds
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000, // 1 second
      headers: config.headers || {},
    };
  }

  /**
   * Make HTTP request with error handling and retries
   */
  private async request<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = this.config.retryDelay,
      skipErrorHandling = false,
      ...fetchOptions
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.debug(`API Request: ${fetchOptions.method || 'GET'} ${fullUrl}`, 'ApiClient', {
          attempt: attempt + 1,
          maxAttempts: retries + 1,
        });

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
            ...fetchOptions.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          if (skipErrorHandling) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Try to parse error response
          let errorData: ApiErrorResponse | undefined;
          try {
            errorData = await response.json();
          } catch {
            // If JSON parsing fails, use status text
          }

          const errorMessage =
            errorData?.error?.message || response.statusText || 'Request failed';

          // Retry on 5xx errors
          if (response.status >= 500 && attempt < retries) {
            logger.warn(`Retrying after ${response.status} error`, 'ApiClient', {
              attempt: attempt + 1,
              url: fullUrl,
            });
            await this.delay(retryDelay * (attempt + 1));
            continue;
          }

          throw new ExternalApiError(fullUrl, errorMessage, {
            statusCode: response.status,
            errorData,
          });
        }

        // Parse response body
        let data: T;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as unknown as T;
        } else {
          data = (await response.blob()) as unknown as T;
        }

        logger.debug(`API Response: ${response.status}`, 'ApiClient', {
          url: fullUrl,
          contentType,
        });

        return {
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle timeout
        if (error instanceof Error && error.name === 'AbortError') {
          logger.warn('API request timeout', 'ApiClient', { url: fullUrl, timeout });

          if (attempt < retries) {
            await this.delay(retryDelay * (attempt + 1));
            continue;
          }

          throw new ServiceUnavailableError('API request timeout', {
            url: fullUrl,
            timeout,
          });
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          logger.warn('Network error, retrying...', 'ApiClient', {
            url: fullUrl,
            attempt: attempt + 1,
          });

          if (attempt < retries) {
            await this.delay(retryDelay * (attempt + 1));
            continue;
          }

          throw new ServiceUnavailableError('Network error', {
            url: fullUrl,
            error: error.message,
          });
        }

        // If it's already an AppError, rethrow
        if (error instanceof ExternalApiError || error instanceof ServiceUnavailableError) {
          throw error;
        }

        // Don't retry on other errors
        throw lastError;
      }
    }

    // If we exhausted all retries
    throw new ServiceUnavailableError('Max retries exceeded', {
      url: fullUrl,
      retries,
      lastError: lastError?.message,
    });
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Export default client instance
export const apiClient = new ApiClient();

// Export factory for custom clients
export const createApiClient = (config: ApiClientConfig) => new ApiClient(config);

/**
 * 速率限制工具
 *
 * 當前使用記憶體存儲，未來可輕鬆切換到 Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60 * 1000, maxRequests: number = 20) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * 檢查是否超過速率限制
   * @param key 唯一識別符（例如：userId）
   * @returns { allowed, remaining }
   */
  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // 如果沒有記錄或已過期，重置
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // 檢查是否超過限制
    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // 增加計數
    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }

  /**
   * 重置特定 key 的限制
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * 清理過期的記錄（可定期調用以節省記憶體）
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// 創建全局實例
// AI API: 每用戶每分鐘 20 次
export const aiRateLimiter = new RateLimiter(60 * 1000, 20);

// 一般 API: 每用戶每分鐘 100 次
export const generalRateLimiter = new RateLimiter(60 * 1000, 100);

// 定期清理過期記錄（每 5 分鐘）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    aiRateLimiter.cleanup();
    generalRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

export default RateLimiter;

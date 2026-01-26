/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and sends to analytics
 */

// Define Metric type based on Next.js web-vitals hook
export interface Metric {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: unknown[];
  navigationType?: string;
}

interface VitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

// Thresholds based on web.dev recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to console in development
 * In production, send to analytics service
 */
export function reportWebVitals(metric: Metric) {
  const vitalsMetric: VitalsMetric = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta ?? 0,
    navigationType: metric.navigationType || 'unknown',
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`📊 Web Vital: ${vitalsMetric.name}`, {
      value: vitalsMetric.value.toFixed(2),
      rating: vitalsMetric.rating,
      delta: vitalsMetric.delta.toFixed(2),
      navigationType: vitalsMetric.navigationType
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Option 1: Send to Vercel Analytics (if using Vercel)
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as { va: (event: string, name: string, data: unknown) => void }).va('event', 'web-vitals', vitalsMetric);
    }

    // Option 2: Send to Google Analytics (if configured)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as { gtag: (command: string, name: string, params: Record<string, unknown>) => void }).gtag('event', vitalsMetric.name, {
        value: Math.round(vitalsMetric.value),
        metric_id: vitalsMetric.id,
        metric_value: vitalsMetric.value,
        metric_delta: vitalsMetric.delta,
        metric_rating: vitalsMetric.rating,
      });
    }

    // Option 3: Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsMetric),
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send web vitals:', error);
    });
  }
}

/**
 * Initialize performance monitoring
 * 返回清理函数以防止内存泄漏
 */
export function initPerformanceMonitoring(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];
  const listeners: Array<{ event: string; handler: EventListener }> = [];

  // Monitor long tasks (tasks taking >50ms)
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long Task detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      observers.push(longTaskObserver);
    } catch {
      // Long task API not supported
    }

    // Monitor resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) {
            console.warn(
              `⚠️ Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`
            );
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      observers.push(resourceObserver);
    } catch {
      // Resource timing not supported
    }
  }

  // Log navigation timing on page load
  const handleLoad = () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      console.warn('📈 Page Performance', {
        totalLoadTime: `${pageLoadTime}ms`,
        connectTime: `${connectTime}ms`,
        renderTime: `${renderTime}ms`
      });
    }, 0);
  };

  window.addEventListener('load', handleLoad);
  listeners.push({ event: 'load', handler: handleLoad as EventListener });

  // 返回清理函数
  return () => {
    // 断开所有 PerformanceObserver
    observers.forEach((observer) => {
      observer.disconnect();
    });

    // 移除所有事件监听器
    listeners.forEach(({ event, handler }) => {
      window.removeEventListener(event, handler);
    });
  };
}

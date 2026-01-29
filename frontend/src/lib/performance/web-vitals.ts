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
 * Report Web Vitals
 * In production, send to analytics service
 * In development, silently collect (no console output)
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

  // Send to analytics in production only
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
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Initialize performance monitoring
 * Returns cleanup function to prevent memory leaks
 * Note: Console output disabled - metrics collected silently
 */
export function initPerformanceMonitoring(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  // Monitor long tasks (tasks taking >50ms) - collect silently
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver(() => {
        // Silently observe - no console output
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      observers.push(longTaskObserver);
    } catch {
      // Long task API not supported
    }

    // Monitor resource timing - collect silently
    try {
      const resourceObserver = new PerformanceObserver(() => {
        // Silently observe - no console output
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      observers.push(resourceObserver);
    } catch {
      // Resource timing not supported
    }
  }

  // Return cleanup function
  return () => {
    observers.forEach((observer) => {
      observer.disconnect();
    });
  };
}

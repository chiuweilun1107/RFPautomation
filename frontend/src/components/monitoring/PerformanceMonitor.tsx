'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals, initPerformanceMonitoring } from '@/lib/performance/web-vitals';

/**
 * Client-side performance monitoring component
 * Tracks Web Vitals and initializes performance observers
 */
export function PerformanceMonitor() {
  // Report Web Vitals using Next.js hook
  useReportWebVitals(reportWebVitals);

  // Initialize additional performance monitoring
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Web Vitals Tracking
 * 
 * Tracks Core Web Vitals and sends them to analytics services:
 * - Sentry (if configured)
 * - Cloudflare Analytics (via beacon)
 * - Console (for debugging)
 */

import type { Metric } from 'web-vitals';

// Extended metric with rating
interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}


/**
 * Determine rating for a metric based on thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    FID: { good: 100, poor: 300 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 600, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to Sentry (if configured)
 */
function sendToSentry(metric: WebVitalMetric) {
  try {
    // Dynamic import to avoid bundling Sentry if not configured
    if (import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        // Set tags for context before recording metric
        Sentry.setTag('metric_name', metric.name);
        Sentry.setTag('rating', metric.rating);
        Sentry.setTag('navigation_type', metric.navigationType);

        Sentry.metrics.distribution('web_vital', metric.value, {
          unit: metric.name === 'CLS' ? 'ratio' : 'millisecond',
        });
      }).catch(() => {
        // Sentry not available, ignore
      });
    }
  } catch (error) {
    // Silently fail if Sentry is not configured

    console.debug('[Web Vitals] Sentry not available:', error);
  }
}

/**
 * Send metric to Cloudflare Analytics (via beacon)
 */
function sendToCloudflareAnalytics(metric: WebVitalMetric) {
  try {
    // Cloudflare Web Analytics uses beacon API
    // The beacon endpoint is automatically handled by Cloudflare if Web Analytics is enabled
    // We can also send custom events via their API

    // For now, we'll use navigator.sendBeacon as a fallback
    // In production, Cloudflare Analytics will automatically collect Web Vitals
    // if the script is included in the page

    const data = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      delta: metric.delta,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    });

    // Try to send via beacon (non-blocking)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', data);
    }
  } catch (error) {
    console.debug('[Web Vitals] Analytics send failed:', error);
  }
}

/**
 * Log metric to console (for debugging)
 */
function logToConsole(metric: WebVitalMetric) {
  const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
  const value = metric.name === 'CLS'
    ? metric.value.toFixed(3)
    : `${Math.round(metric.value)}ms`;

  console.log(
    `[Web Vital] ${emoji} ${metric.name}: ${value} (${metric.rating})`,
    {
      id: metric.id,
      delta: metric.delta,
      navigationType: metric.navigationType,
    }
  );
}

/**
 * Main function to handle Web Vitals metrics
 */
export function reportWebVital(metric: Metric) {
  const webVitalMetric: WebVitalMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
  };

  // Log to console (always, for debugging)
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_VITALS === 'true') {
    logToConsole(webVitalMetric);
  }

  // Send to analytics services (production only)
  if (import.meta.env.PROD) {
    sendToSentry(webVitalMetric);
    sendToCloudflareAnalytics(webVitalMetric);
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamic import to reduce initial bundle size
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP, onFID }) => {
    // Core Web Vitals (required for Google's ranking)
    onCLS(reportWebVital);
    onFCP(reportWebVital);
    onLCP(reportWebVital);
    onTTFB(reportWebVital);

    // Additional metrics (optional but useful)
    if (onINP) {
      onINP(reportWebVital); // Interaction to Next Paint (replaces FID)
    }
    if (onFID) {
      onFID(reportWebVital); // First Input Delay (legacy, replaced by INP)
    }
  }).catch((error) => {
    console.error('[Web Vitals] Failed to initialize:', error);
  });
}

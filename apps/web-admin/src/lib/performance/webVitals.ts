/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals metrics and reports them to console or analytics.
 * See: https://web.dev/vitals/
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface PerformanceMetrics {
    CLS: number | null;  // Cumulative Layout Shift
    FCP: number | null;  // First Contentful Paint
    INP: number | null;  // Interaction to Next Paint
    LCP: number | null;  // Largest Contentful Paint
    TTFB: number | null; // Time to First Byte
}

type MetricName = keyof PerformanceMetrics;

// In-memory cache for latest metrics
const metricsCache: PerformanceMetrics = {
    CLS: null,
    FCP: null,
    INP: null,
    LCP: null,
    TTFB: null,
};

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
    return { ...metricsCache };
}

/**
 * Check if metrics meet performance budget
 */
export function checkPerformanceBudget(): {
    passed: boolean;
    violations: Array<{ metric: string; value: number; budget: number }>;
} {
    const budgets: Record<MetricName, number> = {
        CLS: 0.1,      // Good: < 0.1
        FCP: 1800,     // Good: < 1.8s
        INP: 200,      // Good: < 200ms
        LCP: 2500,     // Good: < 2.5s
        TTFB: 800,     // Good: < 800ms
    };

    const violations: Array<{ metric: string; value: number; budget: number }> = [];

    for (const [metric, budget] of Object.entries(budgets)) {
        const value = metricsCache[metric as MetricName];
        if (value !== null && value > budget) {
            violations.push({ metric, value, budget });
        }
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}

/**
 * Handle incoming metric
 */
function handleMetric(metric: Metric): void {
    const name = metric.name as MetricName;
    metricsCache[name] = metric.value;

    // Log in development
    if (import.meta.env.DEV) {
        const rating = metric.rating;
        const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
        console.log(`${color} ${metric.name}: ${metric.value.toFixed(2)} (${rating})`);
    }

    // Send to analytics in production
    if (import.meta.env.PROD && typeof window !== 'undefined') {
        // Could send to Google Analytics, Sentry, etc.
        // Example: gtag('event', metric.name, { value: Math.round(metric.value) });
    }
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app entry point
 */
export function initWebVitals(): void {
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
}

/**
 * Get performance score (0-100)
 * Based on weighted Core Web Vitals
 */
export function getPerformanceScore(): number | null {
    const { LCP, FCP, CLS, INP, TTFB } = metricsCache;

    // All metrics must be available
    if (LCP === null || FCP === null || CLS === null) {
        return null;
    }

    // Score each metric (0-100)
    const lcpScore = Math.max(0, 100 - (LCP / 25)); // Good < 2500ms
    const fcpScore = Math.max(0, 100 - (FCP / 18)); // Good < 1800ms
    const clsScore = Math.max(0, 100 - (CLS * 1000)); // Good < 0.1
    const inpScore = INP !== null ? Math.max(0, 100 - (INP / 2)) : 100; // Good < 200ms
    const ttfbScore = TTFB !== null ? Math.max(0, 100 - (TTFB / 8)) : 100; // Good < 800ms

    // Weighted average (LCP 25%, FCP 10%, CLS 25%, INP 30%, TTFB 10%)
    return Math.round(
        lcpScore * 0.25 +
        fcpScore * 0.10 +
        clsScore * 0.25 +
        inpScore * 0.30 +
        ttfbScore * 0.10
    );
}

export default { initWebVitals, getPerformanceMetrics, getPerformanceScore, checkPerformanceBudget };

/**
 * Application Performance Monitoring (APM)
 * 
 * Tracks application performance metrics:
 * - API request durations
 * - Database query performance
 * - Component render times
 * - Custom business metrics
 */

import { startTransaction, captureMessage } from '../sentry';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'ratio';
  tags?: Record<string, string>;
  timestamp?: number;
}

interface QueryPerformance {
  query: string;
  duration: number;
  rows?: number;
  error?: string;
}

class APM {
  private metrics: PerformanceMetric[] = [];
  private queryPerformance: QueryPerformance[] = [];
  private readonly maxMetrics = 1000; // Prevent memory leaks

  /**
   * Track a custom metric
   */
  trackMetric(name: string, value: number, unit: 'ms' | 'count' | 'bytes' | 'ratio' = 'ms', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Send to Sentry if configured
    if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
      try {
        import('@sentry/react').then((Sentry) => {
          // Use setTag for adding context before metrics
          if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
              Sentry.setTag(key, value);
            });
          }
          Sentry.metrics.distribution(name, value, {
            unit,
          });
        }).catch(() => {
          // Sentry not available
        });
      } catch (error) {
        console.debug('[APM] Failed to send metric to Sentry:', error);
      }
    }

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Track database query performance
   */
  trackQuery(query: string, duration: number, rows?: number, error?: string) {
    const queryPerf: QueryPerformance = {
      query: this.sanitizeQuery(query),
      duration,
      rows,
      error,
    };

    this.queryPerformance.push(queryPerf);

    // Alert on slow queries (> 1 second)
    if (duration > 1000 && !error) {
      captureMessage(`Slow query detected: ${duration}ms`, 'warning', {
        query: queryPerf.query,
        duration,
        rows,
      });
    }

    // Track metric
    this.trackMetric('db.query.duration', duration, 'ms', {
      query_type: this.getQueryType(query),
      has_error: error ? 'true' : 'false',
    });

    if (rows !== undefined) {
      this.trackMetric('db.query.rows', rows, 'count', {
        query_type: this.getQueryType(query),
      });
    }

    // Keep query performance array size manageable
    if (this.queryPerformance.length > this.maxMetrics) {
      this.queryPerformance = this.queryPerformance.slice(-this.maxMetrics);
    }
  }

  /**
   * Measure function execution time
   */
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    const transaction = startTransaction(name, 'function');

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.trackMetric(`${name}.duration`, duration, 'ms', tags);
      this.trackMetric(`${name}.success`, 1, 'count', tags);

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.trackMetric(`${name}.duration`, duration, 'ms', { ...tags, error: 'true' });
      this.trackMetric(`${name}.error`, 1, 'count', tags);

      throw error;
    } finally {
      // startSpan doesn't return a finish function directly
      // Transaction completes automatically when scope ends
    }
  }

  /**
   * Track API request performance
   */
  trackApiRequest(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    error?: string
  ) {
    const tags = {
      endpoint: this.sanitizeEndpoint(endpoint),
      method,
      status_code: statusCode.toString(),
      has_error: error ? 'true' : 'false',
    };

    this.trackMetric('api.request.duration', duration, 'ms', tags);
    this.trackMetric('api.request.count', 1, 'count', tags);

    // Alert on slow API requests (> 2 seconds)
    if (duration > 2000 && !error) {
      captureMessage(`Slow API request: ${method} ${endpoint} (${duration}ms)`, 'warning', {
        endpoint,
        method,
        duration,
        statusCode,
      });
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, duration: number) {
    this.trackMetric('component.render.duration', duration, 'ms', {
      component: componentName,
    });

    // Alert on slow renders (> 100ms)
    if (duration > 100) {
      captureMessage(`Slow component render: ${componentName} (${duration}ms)`, 'warning', {
        component: componentName,
        duration,
      });
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => (now - (m.timestamp || 0)) < 5 * 60 * 1000);

    const summary = {
      totalMetrics: this.metrics.length,
      metricsLast5Min: last5Minutes.length,
      slowQueries: this.queryPerformance.filter(q => q.duration > 1000).length,
      averageQueryDuration: this.calculateAverage(this.queryPerformance.map(q => q.duration)),
      averageApiDuration: this.calculateAverage(
        last5Minutes
          .filter(m => m.name.startsWith('api.request.duration'))
          .map(m => m.value)
      ),
    };

    return summary;
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000) {
    return this.queryPerformance.filter(q => q.duration > threshold);
  }

  /**
   * Clear metrics (for testing)
   */
  clear() {
    this.metrics = [];
    this.queryPerformance = [];
  }

  // Private helper methods

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query
    return query
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .substring(0, 200); // Limit length
  }

  private sanitizeEndpoint(endpoint: string): string {
    // Normalize endpoint (remove IDs, etc.)
    return endpoint
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .substring(0, 100); // Limit length
  }

  private getQueryType(query: string): string {
    const upperQuery = query.toUpperCase().trim();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
}

// Singleton instance
export const apm = new APM();

// Convenience functions
export const trackMetric = (name: string, value: number, unit?: 'ms' | 'count' | 'bytes' | 'ratio', tags?: Record<string, string>) => {
  apm.trackMetric(name, value, unit, tags);
};

export const trackQuery = (query: string, duration: number, rows?: number, error?: string) => {
  apm.trackQuery(query, duration, rows, error);
};

export const measureFunction = <T>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> => {
  return apm.measureFunction(name, fn, tags);
};

export const trackApiRequest = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  error?: string
) => {
  apm.trackApiRequest(endpoint, method, duration, statusCode, error);
};

export const trackComponentRender = (componentName: string, duration: number) => {
  apm.trackComponentRender(componentName, duration);
};

export default apm;

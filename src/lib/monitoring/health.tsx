/**
 * Health Check Endpoint
 * Returns system status for monitoring
 */

import React from 'react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: {
        database: CheckResult;
        auth: CheckResult;
        cache: CheckResult;
    };
}

interface CheckResult {
    status: 'pass' | 'fail';
    latency?: number;
    message?: string;
}

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

export async function checkDatabase(): Promise<CheckResult> {
    const start = performance.now();

    try {
        // Simple ping query
        const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .maybeSingle();

        const latency = Math.round(performance.now() - start);

        if (error && error.code !== 'PGRST116') {
            return { status: 'fail', latency, message: error.message };
        }

        return { status: 'pass', latency };
    } catch (error) {
        return {
            status: 'fail',
            message: error instanceof Error ? error.message : 'Database connection failed'
        };
    }
}

export async function checkAuth(): Promise<CheckResult> {
    const start = performance.now();

    try {
        const { error } = await supabase.auth.getSession();
        const latency = Math.round(performance.now() - start);

        if (error) {
            return { status: 'fail', latency, message: error.message };
        }

        return { status: 'pass', latency };
    } catch (error) {
        return {
            status: 'fail',
            message: error instanceof Error ? error.message : 'Auth check failed'
        };
    }
}

export function checkCache(): CheckResult {
    try {
        // Test localStorage availability
        const testKey = '__health_check__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);

        // Check service worker
        const swRegistered = 'serviceWorker' in navigator;

        return {
            status: 'pass',
            message: swRegistered ? 'SW registered' : 'SW not available',
        };
    } catch {
        return { status: 'fail', message: 'Storage not available' };
    }
}

export async function runHealthCheck(): Promise<HealthStatus> {
    const [database, auth] = await Promise.all([
        checkDatabase(),
        checkAuth(),
    ]);

    const cache = checkCache();

    const allPassed =
        database.status === 'pass' &&
        auth.status === 'pass' &&
        cache.status === 'pass';

    const someFailed =
        database.status === 'fail' ||
        auth.status === 'fail';

    return {
        status: allPassed ? 'healthy' : someFailed ? 'unhealthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: import.meta.env.VITE_APP_VERSION || '0.0.0',
        checks: { database, auth, cache },
    };
}

// ============================================================================
// HEALTH CHECK COMPONENT
// ============================================================================

interface HealthCheckBadgeProps {
    className?: string;
}

export const HealthCheckBadge: React.FC<HealthCheckBadgeProps> = ({ className = '' }) => {
    const [status, setStatus] = React.useState<HealthStatus | null>(null);

    React.useEffect(() => {
        runHealthCheck().then(setStatus);
    }, []);

    if (!status) return null;

    const colors = {
        healthy: 'bg-green-100 text-green-700',
        degraded: 'bg-amber-100 text-amber-700',
        unhealthy: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status.status]} ${className}`}>
            {status.status === 'healthy' && '● Healthy'}
            {status.status === 'degraded' && '◐ Degraded'}
            {status.status === 'unhealthy' && '○ Unhealthy'}
        </span>
    );
};

export default runHealthCheck;

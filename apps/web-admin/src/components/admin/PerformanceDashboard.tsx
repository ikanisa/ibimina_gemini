/**
 * Performance Dashboard Component
 * 
 * Displays Core Web Vitals and performance metrics for admins
 */

import React, { useState, useEffect } from 'react';
import { Activity, Clock, Gauge, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
    getPerformanceMetrics,
    getPerformanceScore,
    checkPerformanceBudget,
    type PerformanceMetrics
} from '../../lib/performance/webVitals';

interface MetricCardProps {
    name: string;
    value: number | null;
    unit: string;
    threshold: { good: number; poor: number };
    icon: React.ReactNode;
    description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ name, value, unit, threshold, icon, description }) => {
    const getRating = (): 'good' | 'needs-improvement' | 'poor' => {
        if (value === null) return 'needs-improvement';
        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    };

    const rating = getRating();
    const colors = {
        good: 'text-green-600 bg-green-50 border-green-200',
        'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
        poor: 'text-red-600 bg-red-50 border-red-200',
    };

    return (
        <div className={`rounded-xl border p-4 ${colors[rating]}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="font-medium">{name}</span>
            </div>
            <div className="text-2xl font-bold">
                {value !== null ? `${value.toFixed(2)}${unit}` : '—'}
            </div>
            <p className="text-xs mt-1 opacity-75">{description}</p>
        </div>
    );
};

export const PerformanceDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>(getPerformanceMetrics());
    const [score, setScore] = useState<number | null>(null);
    const [budgetStatus, setBudgetStatus] = useState<{ passed: boolean; violations: any[] }>({ passed: true, violations: [] });

    useEffect(() => {
        // Update metrics every 2 seconds
        const interval = setInterval(() => {
            setMetrics(getPerformanceMetrics());
            setScore(getPerformanceScore());
            setBudgetStatus(checkPerformanceBudget());
        }, 2000);

        // Initial update
        setMetrics(getPerformanceMetrics());
        setScore(getPerformanceScore());
        setBudgetStatus(checkPerformanceBudget());

        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge size={20} />
                    Performance Metrics
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Overall Score */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Performance Score</span>
                        {budgetStatus.passed ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle size={14} /> Budget Met
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-red-600 text-sm">
                                <AlertTriangle size={14} /> {budgetStatus.violations.length} Violations
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                        <div
                            className={`h-4 rounded-full transition-all ${score === null ? 'bg-slate-300' :
                                    score >= 90 ? 'bg-green-500' :
                                        score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${score ?? 0}%` }}
                        />
                    </div>
                    <div className="text-center mt-1 text-2xl font-bold">
                        {score !== null ? score : '—'}/100
                    </div>
                </div>

                {/* Core Web Vitals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricCard
                        name="LCP"
                        value={metrics.LCP}
                        unit="ms"
                        threshold={{ good: 2500, poor: 4000 }}
                        icon={<Activity size={16} />}
                        description="Largest Contentful Paint"
                    />
                    <MetricCard
                        name="FCP"
                        value={metrics.FCP}
                        unit="ms"
                        threshold={{ good: 1800, poor: 3000 }}
                        icon={<Zap size={16} />}
                        description="First Contentful Paint"
                    />
                    <MetricCard
                        name="CLS"
                        value={metrics.CLS}
                        unit=""
                        threshold={{ good: 0.1, poor: 0.25 }}
                        icon={<Activity size={16} />}
                        description="Cumulative Layout Shift"
                    />
                    <MetricCard
                        name="INP"
                        value={metrics.INP}
                        unit="ms"
                        threshold={{ good: 200, poor: 500 }}
                        icon={<Zap size={16} />}
                        description="Interaction to Next Paint"
                    />
                    <MetricCard
                        name="TTFB"
                        value={metrics.TTFB}
                        unit="ms"
                        threshold={{ good: 800, poor: 1800 }}
                        icon={<Clock size={16} />}
                        description="Time to First Byte"
                    />
                </div>

                {/* Budget Violations */}
                {budgetStatus.violations.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Performance Budget Violations</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            {budgetStatus.violations.map((v, i) => (
                                <li key={i}>
                                    {v.metric}: {v.value.toFixed(2)} exceeds budget of {v.budget}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PerformanceDashboard;

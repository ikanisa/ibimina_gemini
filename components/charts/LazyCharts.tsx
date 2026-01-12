/**
 * Lazy Loading Chart Components
 * Heavy chart libraries loaded on-demand
 */

import React, { Suspense, lazy, ComponentType } from 'react';

// ============================================================================
// LOADING FALLBACK
// ============================================================================

const ChartLoading: React.FC<{ height?: number }> = ({ height = 300 }) => (
    <div
        className="animate-pulse bg-slate-100 rounded-lg flex items-center justify-center"
        style={{ height }}
    >
        <div className="text-slate-400 text-sm">Loading chart...</div>
    </div>
);

// ============================================================================
// LAZY CHART WRAPPER
// Generic wrapper for any chart component
// ============================================================================

interface LazyChartProps {
    children: React.ReactNode;
    height?: number;
}

export const LazyChartWrapper: React.FC<LazyChartProps> = ({
    children,
    height = 300
}) => (
    <Suspense fallback={<ChartLoading height={height} />}>
        {children}
    </Suspense>
);

// ============================================================================
// CHART COMPONENT TYPES
// ============================================================================

interface BaseChartProps {
    data: any[];
    height?: number;
    className?: string;
}

interface LineChartProps extends BaseChartProps {
    xKey: string;
    yKey: string;
    color?: string;
    showGrid?: boolean;
    showTooltip?: boolean;
}

interface BarChartProps extends BaseChartProps {
    xKey: string;
    yKey: string;
    color?: string;
    horizontal?: boolean;
}

interface PieChartProps extends BaseChartProps {
    dataKey: string;
    nameKey: string;
    colors?: string[];
}

// ============================================================================
// SIMPLE BUILT-IN CHARTS (No external library)
// Use these for basic needs without adding bundle size
// ============================================================================

/**
 * Simple Bar Chart - SVG based, no dependencies
 */
export const SimpleBarChart: React.FC<BarChartProps> = ({
    data,
    xKey,
    yKey,
    height = 200,
    color = '#3b82f6',
    className = '',
}) => {
    if (!data.length) return <div className="text-slate-500 text-center py-8">No data</div>;

    const maxValue = Math.max(...data.map((d) => d[yKey]));
    const barWidth = 100 / data.length;

    return (
        <svg
            className={className}
            viewBox={`0 0 100 ${height / 4}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height }}
        >
            {data.map((item, index) => {
                const barHeight = (item[yKey] / maxValue) * (height / 4 - 10);
                return (
                    <g key={index}>
                        <rect
                            x={index * barWidth + barWidth * 0.1}
                            y={(height / 4) - barHeight}
                            width={barWidth * 0.8}
                            height={barHeight}
                            fill={color}
                            rx={1}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

/**
 * Simple Sparkline - For inline trends
 */
export const Sparkline: React.FC<{
    data: number[];
    width?: number;
    height?: number;
    color?: string;
}> = ({ data, width = 100, height = 30, color = '#3b82f6' }) => {
    if (!data.length) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                points={points}
            />
        </svg>
    );
};

/**
 * Simple Donut Chart
 */
export const SimpleDonutChart: React.FC<{
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}> = ({
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    color = '#3b82f6',
    label
}) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const progress = Math.min(value / max, 1);
        const offset = circumference - progress * circumference;

        return (
            <div className="relative inline-flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e2e8f0"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>
                {label && (
                    <span className="absolute text-sm font-medium text-slate-700">
                        {label}
                    </span>
                )}
            </div>
        );
    };

// ============================================================================
// LAZY LOADED RECHARTS (when you need full-featured charts)
// Only loaded if actually used
// ============================================================================

// Lazy load recharts only when needed
const LazyRechartsLineChart = lazy(() =>
    import('recharts').then((module) => ({
        default: ({ data, xKey, yKey, color, height }: LineChartProps) => {
            const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = module;
            return (
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={data}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey={yKey} stroke={color || '#3b82f6'} />
                    </LineChart>
                </ResponsiveContainer>
            );
        },
    }))
);

const LazyRechartsBarChart = lazy(() =>
    import('recharts').then((module) => ({
        default: ({ data, xKey, yKey, color, height }: BarChartProps) => {
            const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = module;
            return (
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart data={data}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey={yKey} fill={color || '#3b82f6'} />
                    </BarChart>
                </ResponsiveContainer>
            );
        },
    }))
);

// ============================================================================
// EXPORTED LAZY COMPONENTS
// ============================================================================

export const LazyLineChart: React.FC<LineChartProps> = (props) => (
    <Suspense fallback={<ChartLoading height={props.height} />}>
        <LazyRechartsLineChart {...props} />
    </Suspense>
);

export const LazyBarChartFull: React.FC<BarChartProps> = (props) => (
    <Suspense fallback={<ChartLoading height={props.height} />}>
        <LazyRechartsBarChart {...props} />
    </Suspense>
);

export default {
    SimpleBarChart,
    Sparkline,
    SimpleDonutChart,
    LazyLineChart,
    LazyBarChartFull,
    LazyChartWrapper,
};

/**
 * Animation Utilities
 * CSS-based animations without external dependencies
 * Can be enhanced with Framer Motion if installed
 */

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// CSS KEYFRAMES (inject once)
// ============================================================================

const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from { 
    opacity: 0;
    transform: translateX(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-fadeOut { animation: fadeOut 0.3s ease-out; }
.animate-slideInUp { animation: slideInUp 0.3s ease-out; }
.animate-slideInDown { animation: slideInDown 0.3s ease-out; }
.animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
.animate-slideInRight { animation: slideInRight 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-bounce { animation: bounce 0.5s ease-in-out; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-shake { animation: shake 0.5s ease-in-out; }
`;

// Inject styles once
if (typeof document !== 'undefined') {
    const styleId = 'animation-utilities-styles';
    if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = animationStyles;
        document.head.appendChild(styleElement);
    }
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export type AnimationType =
    | 'fadeIn'
    | 'fadeOut'
    | 'slideInUp'
    | 'slideInDown'
    | 'slideInLeft'
    | 'slideInRight'
    | 'scaleIn'
    | 'pulse'
    | 'bounce'
    | 'spin'
    | 'shake';

// ============================================================================
// ANIMATED WRAPPER COMPONENT
// ============================================================================

interface AnimatedProps {
    animation: AnimationType;
    delay?: number;
    duration?: number;
    children: React.ReactNode;
    className?: string;
    onAnimationEnd?: () => void;
}

export const Animated: React.FC<AnimatedProps> = ({
    animation,
    delay = 0,
    duration = 300,
    children,
    className = '',
    onAnimationEnd,
}) => {
    return (
        <div
            className={`animate-${animation} ${className}`}
            style={{
                animationDelay: `${delay}ms`,
                animationDuration: `${duration}ms`,
            }}
            onAnimationEnd={onAnimationEnd}
        >
            {children}
        </div>
    );
};

// ============================================================================
// STAGGERED ANIMATION
// ============================================================================

interface StaggeredListProps {
    children: React.ReactNode[];
    animation?: AnimationType;
    staggerDelay?: number;
    className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    animation = 'slideInUp',
    staggerDelay = 50,
    className = '',
}) => {
    return (
        <div className={className}>
            {React.Children.map(children, (child, index) => (
                <Animated animation={animation} delay={index * staggerDelay}>
                    {child}
                </Animated>
            ))}
        </div>
    );
};

// ============================================================================
// PAGE TRANSITION WRAPPER
// ============================================================================

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    className = '',
}) => {
    return (
        <div className={`animate-fadeIn ${className}`}>
            {children}
        </div>
    );
};

// ============================================================================
// HOVER ANIMATION WRAPPER
// ============================================================================

interface HoverScaleProps {
    children: React.ReactNode;
    scale?: number;
    className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
    children,
    scale = 1.02,
    className = '',
}) => {
    return (
        <div
            className={`transition-transform duration-150 hover:scale-[var(--hover-scale)] ${className}`}
            style={{ '--hover-scale': scale } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

// ============================================================================
// LOADING SPINNER WITH BRAND COLORS
// ============================================================================

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'text-blue-600',
    className = '',
}) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`${sizes[size]} ${color} ${className}`}>
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
};

// ============================================================================
// SUCCESS CHECKMARK ANIMATION
// ============================================================================

export const SuccessCheckmark: React.FC<{ size?: number }> = ({ size = 64 }) => {
    return (
        <div
            className="animate-scaleIn"
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 52 52" className="text-green-500">
                <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="animate-pulse"
                />
                <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l8 8 16-16"
                    className="animate-fadeIn"
                    style={{ animationDelay: '200ms' }}
                />
            </svg>
        </div>
    );
};

export default {
    Animated,
    StaggeredList,
    PageTransition,
    HoverScale,
    LoadingSpinner,
    SuccessCheckmark,
};

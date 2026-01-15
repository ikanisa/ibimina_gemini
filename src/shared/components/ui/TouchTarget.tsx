/**
 * Touch Target Wrapper Component
 * Ensures interactive elements meet 44x44px minimum
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TouchTargetProps {
    children: React.ReactNode;
    className?: string;
    as?: 'div' | 'span';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Wrapper that ensures children meet minimum touch target size (44x44px)
 * Adds padding while keeping visual appearance centered
 */
export const TouchTarget: React.FC<TouchTargetProps> = ({
    children,
    className = '',
    as: Component = 'div',
}) => {
    return (
        <Component
            className={`
        inline-flex items-center justify-center
        min-w-[44px] min-h-[44px]
        ${className}
      `}
        >
            {children}
        </Component>
    );
};

/**
 * HOC to wrap a component with touch target compliance
 */
export function withTouchTarget<P extends object>(
    WrappedComponent: React.ComponentType<P>
): React.FC<P & { touchTargetClassName?: string }> {
    const WithTouchTarget: React.FC<P & { touchTargetClassName?: string }> = ({
        touchTargetClassName,
        ...props
    }) => (
        <TouchTarget className={touchTargetClassName}>
            <WrappedComponent {...(props as P)} />
        </TouchTarget>
    );

    WithTouchTarget.displayName = `withTouchTarget(${WrappedComponent.displayName || WrappedComponent.name || 'Component'
        })`;

    return WithTouchTarget;
}

// ============================================================================
// ICON BUTTON WITH PROPER TOUCH TARGET
// ============================================================================

interface TouchFriendlyIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    label: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'ghost' | 'danger';
}

export const TouchFriendlyIconButton: React.FC<TouchFriendlyIconButtonProps> = ({
    icon,
    label,
    size = 'md',
    variant = 'default',
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'w-10 h-10', // 40px - minimum is 44, but allowing 40 for compact UI
        md: 'w-11 h-11', // 44px - meets minimum
        lg: 'w-12 h-12', // 48px - comfortable
    };

    const variantClasses = {
        default: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
    };

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`
        inline-flex items-center justify-center
        rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
            {...props}
        >
            {icon}
        </button>
    );
};

// ============================================================================
// LINK WITH PROPER TOUCH TARGET
// ============================================================================

interface TouchFriendlyLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    children: React.ReactNode;
}

export const TouchFriendlyLink: React.FC<TouchFriendlyLinkProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <a
            className={`
        inline-flex items-center justify-center
        min-h-[44px] px-3
        text-blue-600 hover:text-blue-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
            {...props}
        >
            {children}
        </a>
    );
};

export default TouchTarget;

/**
 * Mobile Breakpoint Audit Utilities
 * Tools to verify responsive design compliance
 */

// ============================================================================
// BREAKPOINT DEFINITIONS (Tailwind defaults)
// ============================================================================

export const breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ============================================================================
// MOBILE AUDIT RESULTS
// ============================================================================

interface AuditResult {
    element: string;
    issue: string;
    severity: 'error' | 'warning' | 'info';
    recommendation: string;
}

// ============================================================================
// AUDIT FUNCTIONS (Run in browser console)
// ============================================================================

/**
 * Audit for horizontal overflow issues on mobile
 */
export function auditHorizontalOverflow(): AuditResult[] {
    const results: AuditResult[] = [];
    const docWidth = document.documentElement.clientWidth;

    document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 5) {
            results.push({
                element: getElementIdentifier(el),
                issue: `Element extends ${Math.round(rect.right - docWidth)}px beyond viewport`,
                severity: 'error',
                recommendation: 'Add overflow-x-hidden or max-w-full',
            });
        }
    });

    return results;
}

/**
 * Audit for text readability on mobile
 */
export function auditTextReadability(): AuditResult[] {
    const results: AuditResult[] = [];
    const MIN_FONT_SIZE = 14; // Minimum readable on mobile

    document.querySelectorAll('p, span, a, label, td, th').forEach((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);

        if (fontSize < MIN_FONT_SIZE && el.textContent?.trim()) {
            results.push({
                element: getElementIdentifier(el),
                issue: `Font size ${fontSize}px is too small for mobile`,
                severity: 'warning',
                recommendation: 'Use minimum 14px (text-sm in Tailwind)',
            });
        }
    });

    return results;
}

/**
 * Audit for proper responsive images
 */
export function auditImages(): AuditResult[] {
    const results: AuditResult[] = [];

    document.querySelectorAll('img').forEach((img) => {
        const style = window.getComputedStyle(img);
        const width = parseFloat(style.width);
        const maxWidth = style.maxWidth;

        if (width > window.innerWidth && maxWidth === 'none') {
            results.push({
                element: getElementIdentifier(img),
                issue: 'Image exceeds viewport width',
                severity: 'error',
                recommendation: 'Add max-w-full and h-auto classes',
            });
        }

        if (!img.alt) {
            results.push({
                element: getElementIdentifier(img),
                issue: 'Image missing alt attribute',
                severity: 'warning',
                recommendation: 'Add descriptive alt text for accessibility',
            });
        }
    });

    return results;
}

/**
 * Audit for fixed position elements blocking content
 */
export function auditFixedElements(): AuditResult[] {
    const results: AuditResult[] = [];

    document.querySelectorAll('*').forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
            const rect = el.getBoundingClientRect();
            if (rect.height > window.innerHeight * 0.3) {
                results.push({
                    element: getElementIdentifier(el),
                    issue: `Fixed element takes ${Math.round(rect.height / window.innerHeight * 100)}% of viewport`,
                    severity: 'warning',
                    recommendation: 'Consider smaller fixed header/nav on mobile',
                });
            }
        }
    });

    return results;
}

/**
 * Audit for tables without responsive handling
 */
export function auditTables(): AuditResult[] {
    const results: AuditResult[] = [];

    document.querySelectorAll('table').forEach((table) => {
        const rect = table.getBoundingClientRect();
        const parent = table.parentElement;
        const hasOverflow = parent && window.getComputedStyle(parent).overflowX !== 'visible';

        if (rect.width > window.innerWidth && !hasOverflow) {
            results.push({
                element: getElementIdentifier(table),
                issue: 'Table exceeds viewport width without scroll',
                severity: 'error',
                recommendation: 'Wrap in overflow-x-auto container or use ResponsiveTable component',
            });
        }
    });

    return results;
}

/**
 * Audit for proper spacing on mobile
 */
export function auditSpacing(): AuditResult[] {
    const results: AuditResult[] = [];
    const MAX_PADDING = 32; // On mobile, padding > 32px is excessive

    document.querySelectorAll('div, section, main, article').forEach((el) => {
        const style = window.getComputedStyle(el);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);

        if (paddingLeft > MAX_PADDING || paddingRight > MAX_PADDING) {
            if (window.innerWidth < breakpoints.md) {
                results.push({
                    element: getElementIdentifier(el),
                    issue: `Excessive padding on mobile (${paddingLeft}px / ${paddingRight}px)`,
                    severity: 'info',
                    recommendation: 'Use responsive padding: px-4 md:px-8',
                });
            }
        }
    });

    return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getElementIdentifier(el: Element): string {
    if (el.id) return `#${el.id}`;
    if (el.className) {
        const classes = String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.');
        if (classes) return `.${classes}`;
    }
    return el.tagName.toLowerCase();
}

/**
 * Run full mobile audit
 */
export function runMobileAudit(): {
    overflow: AuditResult[];
    text: AuditResult[];
    images: AuditResult[];
    fixed: AuditResult[];
    tables: AuditResult[];
    spacing: AuditResult[];
    summary: { errors: number; warnings: number; info: number };
} {
    const overflow = auditHorizontalOverflow();
    const text = auditTextReadability();
    const images = auditImages();
    const fixed = auditFixedElements();
    const tables = auditTables();
    const spacing = auditSpacing();

    const all = [...overflow, ...text, ...images, ...fixed, ...tables, ...spacing];
    const summary = {
        errors: all.filter((r) => r.severity === 'error').length,
        warnings: all.filter((r) => r.severity === 'warning').length,
        info: all.filter((r) => r.severity === 'info').length,
    };

    return { overflow, text, images, fixed, tables, spacing, summary };
}

/**
 * Print audit results to console
 */
export function printMobileAudit(): void {
    const results = runMobileAudit();

    console.group('📱 Mobile Breakpoint Audit');
    console.log(`Errors: ${results.summary.errors}, Warnings: ${results.summary.warnings}, Info: ${results.summary.info}`);

    if (results.overflow.length) {
        console.group('Horizontal Overflow');
        results.overflow.forEach((r) => console.log(`${r.severity.toUpperCase()}: ${r.element} - ${r.issue}`));
        console.groupEnd();
    }

    if (results.tables.length) {
        console.group('Tables');
        results.tables.forEach((r) => console.log(`${r.severity.toUpperCase()}: ${r.element} - ${r.issue}`));
        console.groupEnd();
    }

    if (results.text.length) {
        console.group('Text Readability');
        results.text.forEach((r) => console.log(`${r.severity.toUpperCase()}: ${r.element} - ${r.issue}`));
        console.groupEnd();
    }

    console.groupEnd();
}

// ============================================================================
// RESPONSIVE BREAKPOINT HOOK
// ============================================================================

import { useState, useEffect } from 'react';

export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

    useEffect(() => {
        const checkBreakpoint = () => {
            const width = window.innerWidth;
            if (width < breakpoints.sm) setBreakpoint('xs');
            else if (width < breakpoints.md) setBreakpoint('sm');
            else if (width < breakpoints.lg) setBreakpoint('md');
            else if (width < breakpoints.xl) setBreakpoint('lg');
            else if (width < breakpoints['2xl']) setBreakpoint('xl');
            else setBreakpoint('2xl');
        };

        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);

    return breakpoint;
}

export function useIsMobile(): boolean {
    const breakpoint = useBreakpoint();
    return breakpoint === 'xs' || breakpoint === 'sm';
}

export default {
    breakpoints,
    runMobileAudit,
    printMobileAudit,
    useBreakpoint,
    useIsMobile,
};

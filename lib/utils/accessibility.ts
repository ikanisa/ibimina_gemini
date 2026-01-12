/**
 * Accessibility Utilities
 * Helpers for WCAG compliance and touch targets
 */

// ============================================================================
// TOUCH TARGET VALIDATION
// WCAG 2.5.8 recommends minimum 44x44 CSS pixels for touch targets
// ============================================================================

export const MINIMUM_TOUCH_TARGET = 44; // pixels

interface TouchTargetResult {
    element: string;
    width: number;
    height: number;
    isCompliant: boolean;
    message: string;
}

/**
 * Check if interactive elements meet minimum touch target size
 * Run this in browser console or as part of E2E tests
 */
export function auditTouchTargets(): TouchTargetResult[] {
    const results: TouchTargetResult[] = [];

    // Select all interactive elements
    const selectors = [
        'button',
        'a[href]',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
        '[role="tab"]',
        '[onclick]',
    ];

    const elements = document.querySelectorAll(selectors.join(', '));

    elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isCompliant = rect.width >= MINIMUM_TOUCH_TARGET && rect.height >= MINIMUM_TOUCH_TARGET;

        // Get element identifier
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className ? `.${String(el.className).split(' ').slice(0, 2).join('.')}` : '';
        const text = el.textContent?.slice(0, 20) || '';
        const identifier = id || classes || text || el.tagName.toLowerCase();

        results.push({
            element: identifier,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isCompliant,
            message: isCompliant
                ? 'Meets 44x44px minimum'
                : `Too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (needs 44x44px)`,
        });
    });

    return results;
}

/**
 * Get non-compliant touch targets
 */
export function getNonCompliantTouchTargets(): TouchTargetResult[] {
    return auditTouchTargets().filter((r) => !r.isCompliant);
}

// ============================================================================
// ARIA VALIDATION
// ============================================================================

interface AriaResult {
    element: string;
    issue: string;
    severity: 'error' | 'warning';
}

/**
 * Audit common ARIA issues
 */
export function auditAria(): AriaResult[] {
    const results: AriaResult[] = [];

    // Check images without alt
    document.querySelectorAll('img:not([alt])').forEach((el) => {
        results.push({
            element: `img${el.id ? `#${el.id}` : ''}`,
            issue: 'Missing alt attribute',
            severity: 'error',
        });
    });

    // Check buttons without accessible name
    document.querySelectorAll('button').forEach((el) => {
        const hasText = el.textContent?.trim();
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledby = el.getAttribute('aria-labelledby');
        const hasTitle = el.getAttribute('title');

        if (!hasText && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
            results.push({
                element: `button${el.id ? `#${el.id}` : ''}`,
                issue: 'Button has no accessible name',
                severity: 'error',
            });
        }
    });

    // Check links without accessible name
    document.querySelectorAll('a[href]').forEach((el) => {
        const hasText = el.textContent?.trim();
        const hasAriaLabel = el.getAttribute('aria-label');

        if (!hasText && !hasAriaLabel) {
            results.push({
                element: `a${el.id ? `#${el.id}` : ''}`,
                issue: 'Link has no accessible name',
                severity: 'error',
            });
        }
    });

    // Check form inputs without labels
    document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((el) => {
        const id = el.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledby = el.getAttribute('aria-labelledby');
        const hasPlaceholder = el.getAttribute('placeholder');

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
            results.push({
                element: `${el.tagName.toLowerCase()}${id ? `#${id}` : ''}`,
                issue: hasPlaceholder
                    ? 'Input uses placeholder instead of label (warning)'
                    : 'Input has no label',
                severity: hasPlaceholder ? 'warning' : 'error',
            });
        }
    });

    // Check for missing heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map((h) => parseInt(h.tagName[1]));

    for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
            results.push({
                element: `h${headingLevels[i]}`,
                issue: `Heading level skipped from h${headingLevels[i - 1]} to h${headingLevels[i]}`,
                severity: 'warning',
            });
        }
    }

    // Check for missing skip link
    const hasSkipLink = document.querySelector('a[href="#main"]') ||
        document.querySelector('a[href="#content"]') ||
        document.querySelector('[class*="skip"]');

    if (!hasSkipLink) {
        results.push({
            element: 'document',
            issue: 'No skip link found',
            severity: 'warning',
        });
    }

    return results;
}

// ============================================================================
// COLOR CONTRAST (basic check)
// ============================================================================

/**
 * Get relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
): number {
    const l1 = getLuminance(color1.r, color1.g, color1.b);
    const l2 = getLuminance(color2.r, color2.g, color2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 * Normal text: 4.5:1
 * Large text (18pt/14pt bold): 3:1
 */
export function meetsWcagAA(ratio: number, isLargeText = false): boolean {
    return ratio >= (isLargeText ? 3 : 4.5);
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Get all focusable elements in order
 */
export function getFocusableElements(container: Element = document.body): Element[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector))
        .filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: Element): boolean {
    const focusableElements = getFocusableElements();
    return focusableElements.includes(element);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    auditTouchTargets,
    getNonCompliantTouchTargets,
    auditAria,
    getContrastRatio,
    meetsWcagAA,
    getFocusableElements,
    isFocusable,
    MINIMUM_TOUCH_TARGET,
};

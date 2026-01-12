/**
 * HTML/XSS Sanitization Utility
 * Uses DOMPurify for safe HTML sanitization
 */

import DOMPurify from 'dompurify';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Allowed tags for rich text content
const ALLOWED_TAGS_RICH = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'];
const ALLOWED_ATTR_RICH = ['href', 'target', 'rel', 'class'];

// Minimal allowed tags (for user names, simple text)
const ALLOWED_TAGS_MINIMAL = ['b', 'i', 'em', 'strong'];
const ALLOWED_ATTR_MINIMAL: string[] = [];

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML for rich text content (allows links, formatting)
 */
export function sanitizeRichHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ALLOWED_TAGS_RICH,
        ALLOWED_ATTR: ALLOWED_ATTR_RICH,
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Sanitize HTML for simple text (only basic formatting)
 */
export function sanitizeText(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ALLOWED_TAGS_MINIMAL,
        ALLOWED_ATTR: ALLOWED_ATTR_MINIMAL,
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Strip all HTML and return plain text
 */
export function stripHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitize for use in HTML attributes (escapes quotes)
 */
export function sanitizeAttr(dirty: string): string {
    return dirty
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Sanitize URL (only allow http, https, mailto protocols)
 */
export function sanitizeUrl(dirty: string): string {
    const trimmed = dirty.trim().toLowerCase();

    // Check for allowed protocols
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:')
    ) {
        return dirty;
    }

    // Block javascript: and data: URLs
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
        return '';
    }

    // For relative URLs, return as-is
    if (trimmed.startsWith('/') || !trimmed.includes(':')) {
        return dirty;
    }

    return '';
}

/**
 * Escape for SQL LIKE queries (prevent wildcards injection)
 */
export function escapeLikePattern(pattern: string): string {
    return pattern
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
    // Remove all non-numeric characters except leading +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Ensure only one + at the start
    if (cleaned.includes('+')) {
        const parts = cleaned.split('+');
        return '+' + parts.join('');
    }

    return cleaned;
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
        .replace(/\.{2,}/g, '.') // Remove multiple dots
        .replace(/^[.-]/, '_') // Don't start with dot or dash
        .slice(0, 255); // Limit length
}

/**
 * General purpose input sanitizer
 * Trims whitespace and removes null bytes
 */
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/\0/g, '') // Remove null bytes
        .replace(/\r/g, ''); // Normalize line endings
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if string contains potential XSS
 */
export function containsXss(input: string): boolean {
    const dangerous = [
        '<script',
        'javascript:',
        'onerror=',
        'onload=',
        'onclick=',
        'onmouseover=',
        'onfocus=',
        'onblur=',
        'eval(',
        'document.cookie',
        'document.write',
    ];

    const lower = input.toLowerCase();
    return dangerous.some((d) => lower.includes(d));
}

/**
 * Check if string contains potential SQL injection
 */
export function containsSqlInjection(input: string): boolean {
    const dangerous = [
        "' OR ",
        "' AND ",
        "'; DROP",
        "'; DELETE",
        "'; UPDATE",
        "'; INSERT",
        "UNION SELECT",
        "UNION ALL SELECT",
        "/*",
        "*/",
        "--",
    ];

    const upper = input.toUpperCase();
    return dangerous.some((d) => upper.includes(d.toUpperCase()));
}

export default {
    sanitizeRichHtml,
    sanitizeText,
    stripHtml,
    sanitizeAttr,
    sanitizeUrl,
    escapeLikePattern,
    sanitizePhone,
    sanitizeFilename,
    sanitizeInput,
    containsXss,
    containsSqlInjection,
};

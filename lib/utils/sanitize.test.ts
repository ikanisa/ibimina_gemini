/**
 * Sanitize Utilities Tests (Extended)
 * Additional tests for edge cases
 */

import { describe, it, expect } from 'vitest';
import {
    stripHtml,
    sanitizeAttr,
    sanitizeUrl,
    escapeLikePattern,
    sanitizePhone,
    sanitizeFilename,
    sanitizeInput,
    containsXss,
    containsSqlInjection,
} from './sanitize';

describe('sanitizeInput', () => {
    it('should handle null and undefined', () => {
        expect(sanitizeInput(null)).toBe('');
        expect(sanitizeInput(undefined)).toBe('');
    });

    it('should handle empty strings', () => {
        expect(sanitizeInput('')).toBe('');
        expect(sanitizeInput('   ')).toBe('');
    });
});

describe('containsXss', () => {
    it('should detect script tags', () => {
        expect(containsXss('<script>alert("xss")</script>')).toBe(true);
        expect(containsXss('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    it('should detect event handlers', () => {
        expect(containsXss('<img onerror="alert(1)">')).toBe(true);
        expect(containsXss('<div onclick="alert(1)">')).toBe(true);
    });

    it('should not flag safe content', () => {
        expect(containsXss('Hello world')).toBe(false);
        expect(containsXss('<p>Safe HTML</p>')).toBe(false);
    });
});

describe('containsSqlInjection', () => {
    it('should detect SQL injection attempts', () => {
        expect(containsSqlInjection("'; DROP TABLE users; --")).toBe(true);
        expect(containsSqlInjection("' OR '1'='1")).toBe(true);
        expect(containsSqlInjection('UNION SELECT * FROM')).toBe(true);
    });

    it('should not flag safe queries', () => {
        expect(containsSqlInjection('SELECT name FROM users')).toBe(false);
        expect(containsSqlInjection("John O'Brien")).toBe(false);
    });
});

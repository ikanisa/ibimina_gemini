/**
 * Sanitize Utilities Tests
 * Unit tests for input sanitization functions
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

describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
        const result = stripHtml('<p>Hello <strong>world</strong>!</p>');
        expect(result).toBe('Hello world!');
    });

    it('should handle script tags', () => {
        const result = stripHtml('<script>alert("xss")</script>Hello');
        expect(result).toBe('Hello');
    });
});

describe('sanitizeAttr', () => {
    it('should escape double quotes', () => {
        const result = sanitizeAttr('value with "quotes"');
        expect(result).toBe('value with &quot;quotes&quot;');
    });

    it('should escape angle brackets', () => {
        const result = sanitizeAttr('<script>evil</script>');
        expect(result).toBe('&lt;script&gt;evil&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
        const result = sanitizeAttr('Tom & Jerry');
        expect(result).toBe('Tom &amp; Jerry');
    });
});

describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
        const result = sanitizeUrl('http://example.com');
        expect(result).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
        const result = sanitizeUrl('https://example.com/path?query=1');
        expect(result).toBe('https://example.com/path?query=1');
    });

    it('should allow mailto URLs', () => {
        const result = sanitizeUrl('mailto:test@example.com');
        expect(result).toBe('mailto:test@example.com');
    });

    it('should allow tel URLs', () => {
        const result = sanitizeUrl('tel:+1234567890');
        expect(result).toBe('tel:+1234567890');
    });

    it('should block javascript URLs', () => {
        const result = sanitizeUrl('javascript:alert("xss")');
        expect(result).toBe('');
    });

    it('should block data URLs', () => {
        const result = sanitizeUrl('data:text/html,<script>evil</script>');
        expect(result).toBe('');
    });

    it('should allow relative URLs', () => {
        const result = sanitizeUrl('/path/to/page');
        expect(result).toBe('/path/to/page');
    });
});

describe('escapeLikePattern', () => {
    it('should escape percentage signs', () => {
        const result = escapeLikePattern('50% off');
        expect(result).toBe('50\\% off');
    });

    it('should escape underscores', () => {
        const result = escapeLikePattern('user_name');
        expect(result).toBe('user\\_name');
    });

    it('should escape backslashes', () => {
        const result = escapeLikePattern('path\\to\\file');
        expect(result).toBe('path\\\\to\\\\file');
    });
});

describe('sanitizePhone', () => {
    it('should keep only digits and leading plus', () => {
        const result = sanitizePhone('+250 788 123 456');
        expect(result).toBe('+250788123456');
    });

    it('should remove dashes and parentheses', () => {
        const result = sanitizePhone('(078) 812-3456');
        expect(result).toBe('0788123456');
    });

    it('should handle multiple plus signs', () => {
        const result = sanitizePhone('++250788');
        expect(result).toBe('+250788');
    });
});

describe('sanitizeFilename', () => {
    it('should replace unsafe characters', () => {
        const result = sanitizeFilename('file<>:"/\\|?*.txt');
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).not.toContain(':');
    });

    it('should limit filename length', () => {
        const longName = 'a'.repeat(300) + '.txt';
        const result = sanitizeFilename(longName);
        expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should not start with dot or dash', () => {
        const result1 = sanitizeFilename('.hidden');
        const result2 = sanitizeFilename('-dash');
        expect(result1[0]).not.toBe('.');
        expect(result2[0]).not.toBe('-');
    });
});

describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
        const result = sanitizeInput('  hello  ');
        expect(result).toBe('hello');
    });

    it('should remove null bytes', () => {
        const result = sanitizeInput('hello\0world');
        expect(result).toBe('helloworld');
    });

    it('should normalize line endings', () => {
        const result = sanitizeInput('line1\r\nline2');
        expect(result).toBe('line1\nline2');
    });
});

describe('containsXss', () => {
    it('should detect script tags', () => {
        expect(containsXss('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript URLs', () => {
        expect(containsXss('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
        expect(containsXss('<img onerror=alert(1)>')).toBe(true);
        expect(containsXss('<div onclick=evil()>')).toBe(true);
    });

    it('should not flag safe content', () => {
        expect(containsXss('Hello, this is normal text')).toBe(false);
        expect(containsXss('JavaScript is a programming language')).toBe(false);
    });
});

describe('containsSqlInjection', () => {
    it('should detect OR injection', () => {
        expect(containsSqlInjection("' OR 1=1--")).toBe(true);
    });

    it('should detect UNION injection', () => {
        expect(containsSqlInjection('UNION SELECT * FROM users')).toBe(true);
    });

    it('should detect DROP injection', () => {
        expect(containsSqlInjection("'; DROP TABLE users;--")).toBe(true);
    });

    it('should not flag safe content', () => {
        expect(containsSqlInjection('John Doe')).toBe(false);
        expect(containsSqlInjection('SELECT laptop from store')).toBe(false);
    });
});

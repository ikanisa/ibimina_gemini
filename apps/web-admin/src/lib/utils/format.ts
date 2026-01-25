/**
 * Format Utilities
 * Common formatting functions for currency, dates, and numbers
 */

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'RWF'): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M ${currency}`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K ${currency}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Format a date string to locale date
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a date string to locale time
 */
export function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a date string to locale date and time
 */
export function formatDateTime(dateString: string): string {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Format a phone number for display
 */
export function formatPhone(phone: string): string {
    if (!phone) return '—';
    // Format Rwanda phone numbers
    if (phone.startsWith('+250')) {
        return phone.replace(/(\+250)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    return phone;
}

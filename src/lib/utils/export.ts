/**
 * Export Utilities
 * Provides functions for exporting data to various formats
 */

// ============================================================================
// CSV EXPORT
// ============================================================================

interface CsvExportOptions {
    filename?: string;
    delimiter?: string;
    includeHeaders?: boolean;
}

/**
 * Convert array of objects to CSV string
 */
export function objectsToCsv<T extends Record<string, unknown>>(
    data: T[],
    options: CsvExportOptions = {}
): string {
    const { delimiter = ',', includeHeaders = true } = options;

    if (data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const lines: string[] = [];

    if (includeHeaders) {
        lines.push(headers.join(delimiter));
    }

    for (const row of data) {
        const values = headers.map((header) => {
            const value = row[header];

            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }

            // Convert to string
            let stringValue = String(value);

            // Escape quotes and wrap in quotes if contains special chars
            if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
                stringValue = `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        });

        lines.push(values.join(delimiter));
    }

    return lines.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCsv(
    data: string,
    filename: string = 'export.csv'
): void {
    const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download
 */
export function exportToCsv<T extends object>(
    data: T[],
    filename: string = 'export.csv',
    options: CsvExportOptions = {}
): void {
    const csv = objectsToCsv(data as Record<string, unknown>[], options);
    downloadCsv(csv, filename);
}

// ============================================================================
// TRANSACTION EXPORT
// ============================================================================

interface TransactionExportRow {
    Date: string;
    Reference: string;
    Type: string;
    Member: string;
    Group: string;
    Amount: string;
    Currency: string;
    Channel: string;
    Status: string;
}

/**
 * Format transactions for export
 */
export function formatTransactionsForExport(
    transactions: Array<{
        id: string;
        created_at: string;
        occurred_at?: string;
        reference?: string | null;
        momo_ref?: string | null;
        type?: string;
        transaction_type?: string;
        member_name?: string | null;
        payer_name?: string | null;
        group_name?: string | null;
        amount: number;
        currency: string;
        channel: string;
        status?: string;
        transaction_status?: string;
    }>
): TransactionExportRow[] {
    return transactions.map((txn) => ({
        Date: formatDateForExport(txn.occurred_at || txn.created_at),
        Reference: txn.momo_ref || txn.reference || txn.id,
        Type: txn.transaction_type || txn.type || 'Unknown',
        Member: txn.member_name || txn.payer_name || 'N/A',
        Group: txn.group_name || 'N/A',
        Amount: formatCurrency(txn.amount, txn.currency),
        Currency: txn.currency,
        Channel: txn.channel,
        Status: txn.transaction_status || txn.status || 'Unknown',
    }));
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCsv(
    transactions: Parameters<typeof formatTransactionsForExport>[0],
    filename?: string
): void {
    const formattedData = formatTransactionsForExport(transactions);
    const dateStr = new Date().toISOString().split('T')[0];
    const exportFilename = filename || `transactions_${dateStr}.csv`;

    exportToCsv(formattedData as unknown as Record<string, unknown>[], exportFilename);
}

// ============================================================================
// MEMBER EXPORT
// ============================================================================

interface MemberExportRow {
    Name: string;
    Phone: string;
    Branch: string;
    Status: string;
    KYC_Status: string;
    Savings_Balance: string;
    Loan_Balance: string;
    Join_Date: string;
}

/**
 * Format members for export
 */
export function formatMembersForExport(
    members: Array<{
        full_name: string;
        phone: string;
        branch?: string | null;
        status: string;
        kyc_status?: string;
        savings_balance?: number | null;
        loan_balance?: number | null;
        join_date?: string | null;
        created_at: string;
    }>
): MemberExportRow[] {
    return members.map((member) => ({
        Name: member.full_name,
        Phone: member.phone,
        Branch: member.branch || 'N/A',
        Status: member.status,
        KYC_Status: member.kyc_status || 'Pending',
        Savings_Balance: formatCurrency(member.savings_balance || 0, 'RWF'),
        Loan_Balance: formatCurrency(member.loan_balance || 0, 'RWF'),
        Join_Date: formatDateForExport(member.join_date || member.created_at),
    }));
}

/**
 * Export members to CSV
 */
export function exportMembersToCsv(
    members: Parameters<typeof formatMembersForExport>[0],
    filename?: string
): void {
    const formattedData = formatMembersForExport(members);
    const dateStr = new Date().toISOString().split('T')[0];
    const exportFilename = filename || `members_${dateStr}.csv`;

    exportToCsv(formattedData as unknown as Record<string, unknown>[], exportFilename);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDateForExport(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }) + ' ' + date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
}

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default {
    exportToCsv,
    exportTransactionsToCsv,
    exportMembersToCsv,
    objectsToCsv,
    downloadCsv,
};

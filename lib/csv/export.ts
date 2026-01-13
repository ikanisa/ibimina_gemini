/**
 * CSV Export Utilities
 * Handles exporting data to CSV format
 */

import type { SupabaseTransaction } from '../../types';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  dateFormat?: 'iso' | 'local' | 'custom';
  customDateFormat?: string;
}

/**
 * Converts data array to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  const {
    includeHeaders = true,
    delimiter = ',',
  } = options;

  if (data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach((row) => {
    Object.keys(row).forEach((key) => allKeys.add(key));
  });

  const headers = Array.from(allKeys);

  // Build CSV lines
  const lines: string[] = [];

  // Add headers
  if (includeHeaders) {
    lines.push(escapeCSVLine(headers, delimiter));
  }

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return formatCSVValue(value, options);
    });
    lines.push(escapeCSVLine(values, delimiter));
  });

  return lines.join('\n');
}

/**
 * Escapes CSV values and joins them
 */
function escapeCSVLine(values: (string | number | null | undefined)[], delimiter: string): string {
  return values.map((value) => escapeCSVValue(value, delimiter)).join(delimiter);
}

/**
 * Escapes a single CSV value
 */
function escapeCSVValue(value: string | number | null | undefined, delimiter: string = ','): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains delimiter, quotes, or newlines, wrap in quotes
  if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

/**
 * Formats a value for CSV export
 */
function formatCSVValue(value: any, options: ExportOptions): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return formatDate(value, options);
  }

  if (typeof value === 'object') {
    // Handle nested objects (e.g., { full_name: "John" })
    if (value.full_name) return value.full_name;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Formats date for CSV export
 */
function formatDate(date: Date, options: ExportOptions): string {
  const { dateFormat = 'iso', customDateFormat } = options;

  switch (dateFormat) {
    case 'iso':
      return date.toISOString();
    case 'local':
      return date.toLocaleString();
    case 'custom':
      if (customDateFormat) {
        // Simple date formatting (for more complex formats, use a library)
        return date.toLocaleDateString('en-US');
      }
      return date.toISOString();
    default:
      return date.toISOString();
  }
}

/**
 * Triggers CSV file download
 */
export function downloadCSV(csvContent: string, filename: string = 'export.csv'): void {
  // Add BOM for Excel compatibility (UTF-8)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports transactions to CSV
 */
export function exportTransactions(
  transactions: SupabaseTransaction[],
  options: ExportOptions = {}
): void {
  const filename = options.filename || `transactions_${new Date().toISOString().split('T')[0]}.csv`;

  // Transform transactions for export
  const exportData = transactions.map((tx) => ({
    id: tx.id,
    date: tx.occurred_at,
    amount: tx.amount,
    currency: tx.currency || 'RWF',
    type: tx.type,
    channel: tx.channel,
    status: tx.status,
    allocation_status: tx.allocation_status,
    payer_name: tx.payer_name || '',
    payer_phone: tx.payer_phone || '',
    momo_ref: tx.momo_ref || '',
    reference: tx.reference || '',
    member_name: (tx.members as any)?.full_name || '',
    group_name: (tx.groups as any)?.name || '',
    allocated_at: tx.allocated_at || '',
  }));

  const csvContent = arrayToCSV(exportData, options);
  downloadCSV(csvContent, filename);
}

/**
 * Exports members to CSV
 */
export function exportMembers(
  members: Array<{
    id: string;
    full_name: string;
    phone: string;
    phone_alt?: string | null;
    member_code?: string | null;
    email?: string | null;
    group_name?: string;
    group_code?: string;
    created_at?: string;
  }>,
  options: ExportOptions = {}
): void {
  const filename = options.filename || `members_${new Date().toISOString().split('T')[0]}.csv`;

  const exportData = members.map((member) => ({
    id: member.id,
    full_name: member.full_name,
    phone: member.phone,
    phone_alt: member.phone_alt || '',
    member_code: member.member_code || '',
    email: member.email || '',
    group_name: member.group_name || '',
    group_code: member.group_code || '',
    created_at: member.created_at || '',
  }));

  const csvContent = arrayToCSV(exportData, options);
  downloadCSV(csvContent, filename);
}

/**
 * Exports groups to CSV
 */
export function exportGroups(
  groups: Array<{
    id: string;
    name: string;
    group_code?: string | null;
    meeting_day?: string | null;
    frequency?: string | null;
    expected_amount?: number | null;
    member_count?: number;
    created_at?: string;
  }>,
  options: ExportOptions = {}
): void {
  const filename = options.filename || `groups_${new Date().toISOString().split('T')[0]}.csv`;

  const exportData = groups.map((group) => ({
    id: group.id,
    name: group.name,
    group_code: group.group_code || '',
    meeting_day: group.meeting_day || '',
    frequency: group.frequency || '',
    expected_amount: group.expected_amount || '',
    member_count: group.member_count || 0,
    created_at: group.created_at || '',
  }));

  const csvContent = arrayToCSV(exportData, options);
  downloadCSV(csvContent, filename);
}

/**
 * Exports report data to CSV
 */
export function exportReport(
  reportData: Record<string, any>[],
  reportName: string,
  options: ExportOptions = {}
): void {
  const filename = options.filename || `${reportName}_${new Date().toISOString().split('T')[0]}.csv`;
  const csvContent = arrayToCSV(reportData, options);
  downloadCSV(csvContent, filename);
}

/**
 * Generates CSV template for import
 */
export function generateCSVTemplate(
  headers: string[],
  sampleData: Record<string, string>[] = []
): string {
  const lines: string[] = [];
  
  // Add headers
  lines.push(escapeCSVLine(headers, ','));

  // Add sample rows if provided
  sampleData.forEach((row) => {
    const values = headers.map((header) => row[header] || '');
    lines.push(escapeCSVLine(values, ','));
  });

  return lines.join('\n');
}

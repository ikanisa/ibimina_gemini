import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../ui';

interface CsvExportProps {
  onExport: () => Promise<string>;
  filename: string;
  disabled?: boolean;
}

export const CsvExport: React.FC<CsvExportProps> = ({
  onExport,
  filename,
  disabled = false
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting || disabled) return;
    
    setExporting(true);
    try {
      const csvContent = await onExport();
      downloadCsv(csvContent, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      onClick={handleExport}
      disabled={exporting || disabled}
    >
      {exporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
};

/**
 * Download a CSV string as a file
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert an array of objects to CSV string
 */
export function objectsToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';

  // Header row
  const header = columns.map(c => `"${c.header}"`).join(',');
  
  // Data rows
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'number') return value.toString();
      if (value instanceof Date) return `"${value.toISOString()}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Generate a timestamped filename for report exports
 */
export function generateReportFilename(scope: string, scopeName?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const name = scopeName ? `_${scopeName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  return `${scope}_report${name}_${date}.csv`;
}


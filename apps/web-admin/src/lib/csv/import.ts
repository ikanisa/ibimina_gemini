/**
 * CSV Import Utilities
 * Handles parsing and processing CSV files for import
 */

export interface ParsedCSVRow {
  [key: string]: string;
}

export interface ParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
  headers?: string[];
}

export interface ParseResult {
  rows: ParsedCSVRow[];
  headers: string[];
  errors: string[];
}

/**
 * Parses CSV text into structured data
 */
export function parseCSV(
  csvText: string,
  options: ParseOptions = {}
): ParseResult {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trimWhitespace = true,
    headers: providedHeaders,
  } = options;

  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/);
  
  if (lines.length === 0) {
    return { rows: [], headers: [], errors: ['CSV file is empty'] };
  }

  // Parse headers
  let headers: string[] = [];
  let startLine = 0;

  if (providedHeaders) {
    headers = providedHeaders;
  } else {
    const headerLine = lines[0];
    if (!headerLine) {
      return { rows: [], headers: [], errors: ['No header row found'] };
    }
    headers = parseCSVLine(headerLine, delimiter, trimWhitespace);
    startLine = 1;
  }

  // Normalize headers (lowercase, trim)
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // Parse data rows
  const rows: ParsedCSVRow[] = [];

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    
    if (skipEmptyLines && !line.trim()) {
      continue;
    }

    const values = parseCSVLine(line, delimiter, trimWhitespace);

    // Handle mismatched column count
    if (values.length !== normalizedHeaders.length) {
      if (values.length > 0) {
        // Try to pad or truncate
        while (values.length < normalizedHeaders.length) {
          values.push('');
        }
        if (values.length > normalizedHeaders.length) {
          values.splice(normalizedHeaders.length);
        }
      } else {
        // Skip empty rows
        continue;
      }
    }

    // Build row object
    const row: ParsedCSVRow = {};
    normalizedHeaders.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return { rows, headers: normalizedHeaders, errors };
}

/**
 * Parses a single CSV line, handling quoted values
 */
function parseCSVLine(
  line: string,
  delimiter: string,
  trimWhitespace: boolean
): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      // End of value
      values.push(trimWhitespace ? currentValue.trim() : currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Push last value
  values.push(trimWhitespace ? currentValue.trim() : currentValue);

  return values;
}

/**
 * Detects CSV delimiter from text
 */
export function detectDelimiter(csvText: string): string {
  const firstLine = csvText.split(/\r?\n/)[0];
  if (!firstLine) return ',';

  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Normalizes CSV headers (handles common variations)
 */
export function normalizeHeaders(headers: string[]): Map<string, string> {
  const mapping = new Map<string, string>();

  // Common header mappings
  const mappings: Record<string, string[]> = {
    name: ['name', 'group_name', 'full_name', 'fullname'],
    full_name: ['full_name', 'fullname', 'name', 'member_name'],
    phone: ['phone', 'phone_primary', 'phone_number', 'mobile', 'tel'],
    phone_alt: ['phone_alt', 'phone_secondary', 'alternate_phone'],
    group_code: ['group_code', 'groupcode', 'group_id', 'group'],
    member_code: ['member_code', 'membercode', 'member_id', 'code'],
    email: ['email', 'email_address', 'e-mail'],
    amount: ['amount', 'value', 'total', 'sum'],
    date: ['date', 'occurred_at', 'transaction_date', 'created_at'],
    currency: ['currency', 'curr', 'ccy'],
  };

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();
    for (const [standardKey, variations] of Object.entries(mappings)) {
      if (variations.includes(normalized)) {
        mapping.set(normalized, standardKey);
        return;
      }
    }
    // If no mapping found, use original
    mapping.set(normalized, normalized);
  });

  return mapping;
}

/**
 * Converts parsed CSV rows to a standardized format
 */
export function standardizeRows(
  rows: ParsedCSVRow[],
  headerMapping: Map<string, string>
): ParsedCSVRow[] {
  return rows.map((row) => {
    const standardized: ParsedCSVRow = {};
    Object.entries(row).forEach(([key, value]) => {
      const standardKey = headerMapping.get(key.toLowerCase()) || key;
      standardized[standardKey] = value;
    });
    return standardized;
  });
}

/**
 * Reads file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
}

/**
 * Validates file type
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'csv') {
    return { valid: false, error: 'File must be a CSV file (.csv extension)' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}

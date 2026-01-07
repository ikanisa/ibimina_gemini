import React, { useState, useRef, useMemo } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, ErrorDisplay, Badge } from '../ui';
import { WizardProgress } from '../WizardProgress';

interface ParsedRow {
  name: string;
  group_code: string;
  isValid: boolean;
  error?: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  failed: number;
  total: number;
  results: { row: number; status: string; error?: string }[];
}

interface BulkGroupImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BulkGroupImport: React.FC<BulkGroupImportProps> = ({ isOpen, onClose, onSuccess }) => {
  const { institutionId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const steps = [
    { id: 'upload', label: 'Upload', description: 'Select CSV' },
    { id: 'import', label: 'Import', description: 'Complete' },
  ];

  const downloadTemplate = () => {
    const csvContent = 'name,group_code\nIbimina y\'Urubyiruko,IBY-001\nTwisungane Savings,TWS-001\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groups_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const nameIdx = headers.indexOf('name');
    const codeIdx = headers.indexOf('group_code');

    if (nameIdx === -1) {
      setError('CSV must have a "name" column');
      return [];
    }

    return lines.slice(1).map((line, idx) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const name = values[nameIdx] || '';
      const group_code = codeIdx >= 0 ? values[codeIdx] || '' : '';

      const isValid = name.length > 0;
      const error = !isValid ? 'Name is required' : undefined;

      return { name, group_code, isValid, error };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length > 0) {
        setCurrentStep(1);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!institutionId || parsedRows.length === 0) return;

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setError('No valid rows to import');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('bulk_import_groups', {
        p_institution_id: institutionId,
        p_rows: validRows.map(r => ({ name: r.name, group_code: r.group_code || null })),
      });

      if (rpcError) throw rpcError;

      setImportResult(data as ImportResult);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFile(null);
    setParsedRows([]);
    setError(null);
    setImportResult(null);
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Groups from CSV" size="lg">
      {/* Wizard Progress */}
      <div className="px-6 pt-4 pb-4 border-b border-slate-200">
        <WizardProgress
          steps={steps}
          currentStep={currentStep}
          completedSteps={importResult ? [1, 2] : currentStep > 0 ? [1] : []}
        />
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {error && <ErrorDisplay error={error} variant="inline" className="mb-4" />}

        {importResult && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={18} />
              Import Complete!
            </div>
            <p className="text-sm mt-1">
              {importResult.inserted} inserted, {importResult.updated} updated, {importResult.failed} failed
            </p>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Download template */}
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download size={18} />
              Download CSV Template
            </button>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  const input = fileInputRef.current;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(droppedFile);
                    input.files = dt.files;
                    handleFileSelect({ target: input } as any);
                  }
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="mx-auto text-slate-400 mb-3" size={40} />
              <p className="text-slate-600 font-medium mb-1">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-slate-400">
                Required column: name. Optional: group_code
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Import */}
        {currentStep === 1 && parsedRows.length > 0 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="success">{validCount} valid</Badge>
                {invalidCount > 0 && <Badge variant="danger">{invalidCount} invalid</Badge>}
              </div>
              <button
                onClick={() => { setCurrentStep(0); setFile(null); setParsedRows([]); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Change file
              </button>
            </div>

            {/* Preview table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Code</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                        <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-900">{row.name || '—'}</td>
                        <td className="px-4 py-2 text-slate-600 font-mono text-xs">{row.group_code || '—'}</td>
                        <td className="px-4 py-2 text-center">
                          {row.isValid ? (
                            <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                          ) : (
                            <span className="text-xs text-red-600">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 flex justify-between">
        <Button variant="secondary" onClick={handleClose}>
          {importResult ? 'Close' : 'Cancel'}
        </Button>

        {currentStep === 1 && !importResult && (
          <Button
            variant="primary"
            onClick={handleImport}
            isLoading={isImporting}
            disabled={validCount === 0}
            leftIcon={<Upload size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            Import {validCount} Groups
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default BulkGroupImport;


import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, ErrorDisplay, Badge } from '../ui';
import { WizardProgress } from '../WizardProgress';

interface Group {
  id: string;
  group_name: string;
  group_code?: string;
}

interface ParsedRow {
  full_name: string;
  member_code: string;
  phone_primary: string;
  phone_alt: string;
  group_code: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  inserted: number;
  updated: number;
  failed: number;
  total: number;
  results: { row: number; status: string; error?: string }[];
}

interface BulkMemberImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BulkMemberImport: React.FC<BulkMemberImportProps> = ({ isOpen, onClose, onSuccess }) => {
  const { institutionId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const steps = [
    { id: 'upload', label: 'Upload', description: 'Select CSV' },
    { id: 'import', label: 'Import', description: 'Complete' },
  ];

  // Load groups and existing phones
  useEffect(() => {
    if (!institutionId || !isOpen) return;

    const loadData = async () => {
      // Load groups
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, group_name, group_code')
        .eq('institution_id', institutionId)
        .eq('status', 'ACTIVE');
      
      if (groupData) setGroups(groupData);

      // Load existing phones for duplicate warning
      const { data: memberData } = await supabase
        .from('members')
        .select('phone')
        .eq('institution_id', institutionId);
      
      if (memberData) {
        setExistingPhones(new Set(memberData.map(m => m.phone).filter(Boolean)));
      }
    };

    loadData();
  }, [institutionId, isOpen]);

  const downloadTemplate = () => {
    const csvContent = 'full_name,member_code,phone_primary,phone_alt,group_code\nJean Pierre Habimana,M-JPH001,0788123456,,IBY-001\nMarie Claire Uwimana,M-MCU002,0788654321,0789111222,TWS-001\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const nameIdx = headers.indexOf('full_name');
    const codeIdx = headers.indexOf('member_code');
    const phoneIdx = headers.indexOf('phone_primary');
    const phoneAltIdx = headers.indexOf('phone_alt');
    const groupCodeIdx = headers.indexOf('group_code');

    if (nameIdx === -1) {
      setError('CSV must have a "full_name" column');
      return [];
    }

    const groupCodeMap = new Map(groups.map(g => [g.group_code?.toLowerCase(), g.id]));

    return lines.slice(1).map((line, idx) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const full_name = values[nameIdx] || '';
      const member_code = codeIdx >= 0 ? values[codeIdx] || '' : '';
      const phone_primary = phoneIdx >= 0 ? values[phoneIdx] || '' : '';
      const phone_alt = phoneAltIdx >= 0 ? values[phoneAltIdx] || '' : '';
      const group_code = groupCodeIdx >= 0 ? values[groupCodeIdx] || '' : '';

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate
      if (!full_name) errors.push('Name required');
      if (phone_primary && !validatePhone(phone_primary)) errors.push('Invalid phone');
      if (group_code && !groupCodeMap.has(group_code.toLowerCase())) {
        errors.push(`Group "${group_code}" not found`);
      }

      // Warnings (soft)
      if (phone_primary && existingPhones.has(phone_primary)) {
        warnings.push('Phone already exists');
      }

      const isValid = errors.length === 0;

      return { full_name, member_code, phone_primary, phone_alt, group_code, isValid, errors, warnings };
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
      const { data, error: rpcError } = await supabase.rpc('bulk_import_members', {
        p_institution_id: institutionId,
        p_rows: validRows.map(r => ({
          full_name: r.full_name,
          member_code: r.member_code || null,
          phone_primary: r.phone_primary || null,
          phone_alt: r.phone_alt || null,
          group_code: r.group_code || null,
        })),
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
  const warningCount = parsedRows.filter(r => r.isValid && r.warnings.length > 0).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Members from CSV" size="xl">
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
                Required: full_name. Optional: member_code, phone_primary, phone_alt, group_code
              </p>
            </div>

            {/* Group codes reference */}
            {groups.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-2">Available group codes:</p>
                <div className="flex flex-wrap gap-2">
                  {groups.filter(g => g.group_code).slice(0, 10).map(g => (
                    <span key={g.id} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded font-mono">
                      {g.group_code}
                    </span>
                  ))}
                  {groups.filter(g => g.group_code).length > 10 && (
                    <span className="text-xs text-slate-400">+{groups.filter(g => g.group_code).length - 10} more</span>
                  )}
                </div>
              </div>
            )}
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
                {warningCount > 0 && <Badge variant="warning">{warningCount} with warnings</Badge>}
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
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Phone</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Group</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={!row.isValid ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-amber-50' : ''}>
                        <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.full_name || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-xs">{row.member_code || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.phone_primary || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-xs">{row.group_code || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {row.isValid ? (
                            row.warnings.length > 0 ? (
                              <span className="text-xs text-amber-600 flex items-center gap-1 justify-center">
                                <AlertTriangle size={12} />
                                {row.warnings[0]}
                              </span>
                            ) : (
                              <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-xs text-red-600">{row.errors[0]}</span>
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
            Import {validCount} Members
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default BulkMemberImport;


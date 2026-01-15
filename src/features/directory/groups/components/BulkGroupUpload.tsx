import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Modal, Button, ErrorDisplay } from '@/shared/components/ui';
import { WizardProgress } from '@/shared/components/ui';

interface ParsedGroup {
    group_name: string;
    meeting_day?: string;
    frequency?: 'Daily' | 'Weekly' | 'Monthly';
    expected_amount?: number;
}

interface BulkGroupUploadProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const BulkGroupUpload: React.FC<BulkGroupUploadProps> = ({ onClose, onSuccess }) => {
    const { institutionId } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isParsed, setIsParsed] = useState(false);
    const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState(0);
    const [isImporting, setIsImporting] = useState(false);

    // Wizard steps
    const steps = useMemo(() => [
        { id: 'upload', label: 'Upload', description: 'Select document' },
        { id: 'review', label: 'Review', description: 'Verify data' },
        { id: 'import', label: 'Import', description: 'Complete' }
    ], []);

    // Determine current step
    const currentStep = useMemo(() => {
        if (successCount > 0) return 2; // Completed
        if (isParsed) return 1; // Review step
        return 0; // Upload step
    }, [isParsed, successCount]);

    // Completed steps
    const completedSteps = useMemo(() => {
        const completed: number[] = [];
        if (file) completed.push(1);
        if (isParsed) completed.push(2);
        if (successCount > 0) completed.push(3);
        return completed;
    }, [file, isParsed, successCount]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setIsParsed(false);
            setParsedGroups([]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
            setIsParsed(false);
            setParsedGroups([]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // Process file with Edge Function (secure, uses server-side API key)
    const processWithGemini = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Convert file to base64
            const base64 = await fileToBase64(file);

            // Call Edge Function for OCR
            const { data, error: fnError } = await supabase.functions.invoke('ocr-extract', {
                body: {
                    image: base64,
                    extractType: 'groups'
                }
            });

            if (fnError) {
                throw new Error(fnError.message || 'Failed to process document');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const groups: ParsedGroup[] = data?.data || [];

            if (groups.length === 0) {
                setError('No group data found in document. Please upload a document with group names.');
            } else {
                setParsedGroups(groups);
                setIsParsed(true);
            }
        } catch (err) {
            console.error('OCR processing error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process document');
        } finally {
            setIsProcessing(false);
        }
    };

    // Import parsed groups to Supabase
    const importGroups = async () => {
        if (!institutionId || parsedGroups.length === 0) return;

        setIsImporting(true);
        setIsProcessing(true);
        setError(null);
        let imported = 0;

        try {
            for (const group of parsedGroups) {
                const { error: insertError } = await supabase
                    .from('groups')
                    .insert({
                        institution_id: institutionId,
                        group_name: group.group_name,
                        meeting_day: group.meeting_day || 'Monday',
                        frequency: group.frequency || 'Weekly',
                        expected_amount: group.expected_amount || 5000,
                        cycle_label: `Cycle ${new Date().getFullYear()}`,
                        status: 'ACTIVE'
                    });

                if (insertError) {
                    console.error('Error inserting group:', insertError);
                    continue;
                }

                imported++;
            }

            setSuccessCount(imported);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to import some groups');
        } finally {
            setIsProcessing(false);
            setIsImporting(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const frequencyColors: Record<string, string> = {
        Daily: 'bg-purple-100 text-purple-700',
        Weekly: 'bg-blue-100 text-blue-700',
        Monthly: 'bg-green-100 text-green-700'
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Bulk Group Upload"
            size="lg"
        >
            {/* Wizard Progress */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-200">
                <WizardProgress
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                />
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <ErrorDisplay error={error} variant="inline" className="mb-4" />
                    )}

                    {successCount > 0 && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                            <CheckCircle2 size={16} />
                            Successfully imported {successCount} groups!
                        </div>
                    )}

                    {/* File Upload Area */}
                    {!isParsed && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 active:scale-[0.98]"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="mx-auto text-slate-400 mb-3" size={40} />
                            <p className="text-slate-600 font-medium mb-1">
                                {file ? file.name : 'Drop your file here or click to browse'}
                            </p>
                            <p className="text-sm text-slate-400">
                                Supports images, PDFs, Excel files with group lists
                            </p>
                        </div>
                    )}

                    {/* Parsed Groups Preview */}
                    {isParsed && parsedGroups.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-800">Extracted Groups ({parsedGroups.length})</h3>
                                <button
                                    onClick={() => { setIsParsed(false); setParsedGroups([]); setFile(null); }}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                    Upload Different File
                                </button>
                            </div>
                            <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200 max-h-64 overflow-y-auto">
                                {parsedGroups.map((group, idx) => (
                                    <div 
                                        key={idx} 
                                        className="p-3 flex items-center justify-between hover:bg-slate-100 transition-colors duration-150 animate-in fade-in slide-in-from-right"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">{group.group_name}</p>
                                            <p className="text-sm text-slate-500">
                                                {group.meeting_day || 'No meeting day'} • {group.expected_amount?.toLocaleString() || 'No amount'} RWF
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${frequencyColors[group.frequency || 'Weekly'] || 'bg-slate-100 text-slate-700'}`}>
                                            {group.frequency || 'Weekly'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isProcessing || isImporting}
                >
                    {successCount > 0 ? 'Close' : 'Cancel'}
                </Button>
                {!isParsed && file && (
                    <Button
                        variant="primary"
                        onClick={processWithGemini}
                        isLoading={isProcessing}
                        leftIcon={<FileText size={16} />}
                    >
                        Extract Data with AI
                    </Button>
                )}
                {isParsed && parsedGroups.length > 0 && !isImporting && (
                    <Button
                        variant="primary"
                        onClick={importGroups}
                        disabled={isProcessing}
                        leftIcon={<CheckCircle2 size={16} />}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Import {parsedGroups.length} Groups
                    </Button>
                )}
                {isImporting && (
                    <Button
                        variant="primary"
                        disabled
                        isLoading={true}
                        className="bg-green-600"
                    >
                        Importing...
                    </Button>
                )}
            </div>
        </Modal>
    );
};

export default BulkGroupUpload;

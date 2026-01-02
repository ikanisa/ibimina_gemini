import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Users, CheckCircle2, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Briefcase className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Bulk Group Upload</h2>
                            <p className="text-sm text-slate-500">Upload a document to import multiple saving groups</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {successCount > 0 && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
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
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
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
                                    <div key={idx} className="p-3 flex items-center justify-between">
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
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                        Cancel
                    </button>
                    {!isParsed && file && (
                        <button
                            onClick={processWithGemini}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Processing with Gemini...
                                </>
                            ) : (
                                <>
                                    <FileText size={16} /> Extract Data with AI
                                </>
                            )}
                        </button>
                    )}
                    {isParsed && parsedGroups.length > 0 && (
                        <button
                            onClick={importGroups}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} /> Import {parsedGroups.length} Groups
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkGroupUpload;

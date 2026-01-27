import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Button, ErrorDisplay } from './ui';
import { WizardProgress } from './WizardProgress';

interface ParsedMember {
    full_name: string;
    phone: string;
    group_name?: string;
}

interface BulkMemberUploadProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const BulkMemberUpload: React.FC<BulkMemberUploadProps> = ({ onClose, onSuccess }) => {
    const { institutionId } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isParsed, setIsParsed] = useState(false);
    const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
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
            setParsedMembers([]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
            setIsParsed(false);
            setParsedMembers([]);
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
                    extractType: 'members'
                }
            });

            if (fnError) {
                throw new Error(fnError.message || 'Failed to process document');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const members: ParsedMember[] = data?.data || [];

            if (members.length === 0) {
                setError('No member data found in document. Please upload a document with member names and phone numbers.');
            } else {
                setParsedMembers(members);
                setIsParsed(true);
            }
        } catch (err) {
            console.error('OCR processing error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process document');
        } finally {
            setIsProcessing(false);
        }
    };

    // Import parsed members to Supabase
    const importMembers = async () => {
        if (!institutionId || parsedMembers.length === 0) return;

        setIsImporting(true);
        setIsProcessing(true);
        setError(null);
        let imported = 0;

        try {
            // First, get all groups for this institution to match group names
            const { data: groups } = await supabase
                .from('groups')
                .select('id, group_name')
                .eq('institution_id', institutionId);

            const groupMap = new Map(groups?.map(g => [g.group_name.toLowerCase(), g.id]) || []);

            for (const member of parsedMembers) {
                // Insert member
                const { data: memberData, error: memberError } = await supabase
                    .from('members')
                    .insert({
                        institution_id: institutionId,
                        full_name: member.full_name,
                        phone: member.phone,
                        status: 'ACTIVE',
                        kyc_status: 'PENDING'
                    })
                    .select()
                    .single();

                if (memberError) {
                    console.error('Error inserting member:', memberError);
                    continue;
                }

                // Link to group if group name was provided and found
                if (member.group_name && memberData) {
                    const groupId = groupMap.get(member.group_name.toLowerCase());
                    if (groupId) {
                        await supabase.from('group_members').insert({
                            institution_id: institutionId,
                            group_id: groupId,
                            member_id: memberData.id
                        });
                    }
                }

                imported++;
            }

            setSuccessCount(imported);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to import some members');
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

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Bulk Member Upload"
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
                        Successfully imported {successCount} members!
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
                            Supports images, PDFs, Excel files with member lists
                        </p>
                    </div>
                )}

                {/* Parsed Members Preview */}
                {isParsed && parsedMembers.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800">Extracted Members ({parsedMembers.length})</h3>
                            <button
                                onClick={() => { setIsParsed(false); setParsedMembers([]); setFile(null); }}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Upload Different File
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200 max-h-64 overflow-y-auto">
                            {parsedMembers.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 flex items-center justify-between hover:bg-slate-100 transition-colors duration-150 animate-in fade-in slide-in-from-right"
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{member.full_name}</p>
                                        <p className="text-sm text-slate-500">{member.phone}</p>
                                    </div>
                                    {member.group_name && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {member.group_name}
                                        </span>
                                    )}
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
                {isParsed && parsedMembers.length > 0 && !isImporting && (
                    <Button
                        variant="primary"
                        onClick={importMembers}
                        disabled={isProcessing}
                        leftIcon={<CheckCircle2 size={16} />}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Import {parsedMembers.length} Members
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

export default BulkMemberUpload;

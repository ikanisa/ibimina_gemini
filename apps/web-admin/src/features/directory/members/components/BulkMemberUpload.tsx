/**
 * BulkMemberUpload Component
 * 
 * Gemini OCR-powered bulk member upload with group selection.
 * Features smart group matching and manual selection for unmatched members.
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Upload, FileText, Users, CheckCircle2, AlertCircle, Loader2, Search, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Modal, Button, ErrorDisplay } from '@/shared/components/ui';
import { WizardProgress } from '@/shared/components/ui';
import { cn } from '@/lib/utils/cn';

interface ParsedMember {
    full_name: string;
    phone: string;
    group_name?: string;
    matched_group_id?: string;
    matched_group_name?: string;
}

interface GroupInfo {
    id: string;
    group_name: string;
    member_count?: number;
    frequency?: string;
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
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');

    // Wizard steps
    const steps = useMemo(() => [
        { id: 'upload', label: 'Upload', description: 'Select document' },
        { id: 'review', label: 'Review', description: 'Verify & assign groups' },
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

    // Fetch groups for matching
    const fetchGroups = useCallback(async () => {
        if (!institutionId) return [];

        const { data, error } = await supabase
            .from('groups')
            .select('id, group_name, frequency')
            .eq('institution_id', institutionId)
            .eq('status', 'ACTIVE')
            .order('group_name', { ascending: true });

        if (error) {
            console.error('Error fetching groups:', error);
            return [];
        }

        // Get member counts
        const groupsWithCounts = await Promise.all(
            (data || []).map(async (group) => {
                const { count } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);

                return {
                    ...group,
                    member_count: count || 0,
                };
            })
        );

        setGroups(groupsWithCounts);
        return groupsWithCounts;
    }, [institutionId]);

    // Match parsed group names to actual groups
    const matchGroups = useCallback((members: ParsedMember[], groupList: GroupInfo[]): ParsedMember[] => {
        return members.map(member => {
            if (!member.group_name) return member;

            // Fuzzy match group name
            const searchTerm = member.group_name.toLowerCase().trim();
            const matchedGroup = groupList.find(g => {
                const name = g.group_name.toLowerCase();
                return name === searchTerm ||
                    name.includes(searchTerm) ||
                    searchTerm.includes(name);
            });

            if (matchedGroup) {
                return {
                    ...member,
                    matched_group_id: matchedGroup.id,
                    matched_group_name: matchedGroup.group_name,
                };
            }

            return member;
        });
    }, []);

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
            // Fetch groups first
            const groupList = await fetchGroups();

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

            let members: ParsedMember[] = data?.data || [];

            if (members.length === 0) {
                setError('No member data found in document. Please upload a document with member names and phone numbers.');
            } else {
                // Match groups
                members = matchGroups(members, groupList);
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

    // Update member's group assignment
    const updateMemberGroup = (index: number, groupId: string, groupName: string) => {
        setParsedMembers(prev => prev.map((m, i) =>
            i === index
                ? { ...m, matched_group_id: groupId, matched_group_name: groupName }
                : m
        ));
        setEditingMemberIndex(null);
        setGroupSearchTerm('');
    };

    // Clear member's group assignment
    const clearMemberGroup = (index: number) => {
        setParsedMembers(prev => prev.map((m, i) =>
            i === index
                ? { ...m, matched_group_id: undefined, matched_group_name: undefined }
                : m
        ));
    };

    // Check if all members have groups assigned
    const allMembersHaveGroups = useMemo(() => {
        return parsedMembers.every(m => m.matched_group_id);
    }, [parsedMembers]);

    // Import parsed members to Supabase
    const importMembers = async () => {
        if (!institutionId || parsedMembers.length === 0) return;

        setIsImporting(true);
        setIsProcessing(true);
        setError(null);
        let imported = 0;

        try {
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

                // Link to group if matched
                if (member.matched_group_id && memberData) {
                    await supabase.from('group_members').insert({
                        institution_id: institutionId,
                        group_id: member.matched_group_id,
                        member_id: memberData.id,
                        role: 'MEMBER',
                        status: 'GOOD_STANDING',
                    });
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

    // Filtered groups for dropdown
    const filteredGroups = useMemo(() => {
        if (!groupSearchTerm.trim()) return groups;
        const term = groupSearchTerm.toLowerCase();
        return groups.filter(g => g.group_name.toLowerCase().includes(term));
    }, [groups, groupSearchTerm]);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Bulk Member Upload"
            size="lg"
        >
            {/* Wizard Progress */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
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
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                        <CheckCircle2 size={18} />
                        <span className="font-medium">Successfully imported {successCount} members!</span>
                    </div>
                )}

                {/* File Upload Area */}
                {!isParsed && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 active:scale-[0.98]",
                            file
                                ? "border-blue-300 bg-blue-50/50"
                                : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className={cn(
                            "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                            file
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-400"
                        )}>
                            <Upload size={28} />
                        </div>
                        <p className="text-slate-700 font-medium mb-1">
                            {file ? file.name : 'Drop your file here or click to browse'}
                        </p>
                        <p className="text-sm text-slate-400">
                            Supports images, PDFs, Excel files with member lists
                        </p>
                        {file && (
                            <p className="text-xs text-blue-600 mt-2">
                                ✓ File selected - Click "Extract Data" to continue
                            </p>
                        )}
                    </div>
                )}

                {/* Parsed Members Preview */}
                {isParsed && parsedMembers.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-800">Extracted Members ({parsedMembers.length})</h3>
                                {!allMembersHaveGroups && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Some members need group assignment
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsParsed(false); setParsedMembers([]); setFile(null); }}
                                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                            >
                                Upload Different File
                            </button>
                        </div>

                        {/* Members List */}
                        <div className="bg-slate-50/50 rounded-xl border border-slate-200 divide-y divide-slate-200 max-h-80 overflow-y-auto">
                            {parsedMembers.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 hover:bg-white transition-colors duration-150 animate-in fade-in slide-in-from-right"
                                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Member Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900">{member.full_name}</p>
                                            <p className="text-sm text-slate-500">{member.phone}</p>
                                            {member.group_name && !member.matched_group_id && (
                                                <p className="text-xs text-amber-500 mt-1">
                                                    OCR detected: "{member.group_name}" (not matched)
                                                </p>
                                            )}
                                        </div>

                                        {/* Group Assignment */}
                                        <div className="shrink-0">
                                            {member.matched_group_id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg">
                                                        <Users size={12} />
                                                        {member.matched_group_name}
                                                    </span>
                                                    <button
                                                        onClick={() => setEditingMemberIndex(idx)}
                                                        className="text-xs text-slate-400 hover:text-blue-600 hover:underline"
                                                    >
                                                        Change
                                                    </button>
                                                    <button
                                                        onClick={() => clearMemberGroup(idx)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingMemberIndex(idx)}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                                        "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                                    )}
                                                >
                                                    <Users size={12} />
                                                    Assign Group
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Group Selection Dropdown */}
                                    {editingMemberIndex === idx && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                                            <div className="relative mb-2">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={groupSearchTerm}
                                                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                                                    placeholder="Search groups..."
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                                                {filteredGroups.length === 0 ? (
                                                    <p className="py-3 text-center text-sm text-slate-400">No groups found</p>
                                                ) : (
                                                    filteredGroups.map((group) => (
                                                        <button
                                                            key={group.id}
                                                            onClick={() => updateMemberGroup(idx, group.id, group.group_name)}
                                                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center justify-between"
                                                        >
                                                            <span className="text-sm font-medium text-slate-900">{group.group_name}</span>
                                                            <span className="text-xs text-slate-400">{group.member_count} members</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { setEditingMemberIndex(null); setGroupSearchTerm(''); }}
                                                className="mt-2 w-full py-1.5 text-xs text-slate-500 hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                                {parsedMembers.filter(m => m.matched_group_id).length} with groups
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <AlertCircle size={12} className="text-amber-500" />
                                {parsedMembers.filter(m => !m.matched_group_id).length} need assignment
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-end bg-slate-50/50">
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
                        disabled={isProcessing || !allMembersHaveGroups}
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

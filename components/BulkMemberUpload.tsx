import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

    // Process file with Gemini OCR
    const processWithGemini = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Convert file to base64
            const base64 = await fileToBase64(file);
            const mimeType = file.type || 'image/png';

            // Call Gemini API for OCR
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64.split(',')[1] // Remove data:mime;base64, prefix
                                    }
                                },
                                {
                                    text: `Extract member information from this document. Return a JSON array of objects with these fields:
- full_name: the person's full name
- phone: phone number (format as +250XXXXXXXXX if Rwandan)
- group_name: the group/ibimina name if mentioned

Return ONLY valid JSON array, no other text. Example:
[{"full_name": "Jean Pierre", "phone": "+250788123456", "group_name": "Ibimina ya Gasabo"}]

If you cannot extract valid data, return an empty array: []`
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4096
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

            // Parse the JSON from Gemini response
            const jsonMatch = textContent.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Could not extract member data from document');
            }

            const members: ParsedMember[] = JSON.parse(jsonMatch[0]);

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Bulk Member Upload</h2>
                            <p className="text-sm text-slate-500">Upload a document to import multiple members</p>
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
                            Successfully imported {successCount} members!
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
                                    <div key={idx} className="p-3 flex items-center justify-between">
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
                    {isParsed && parsedMembers.length > 0 && (
                        <button
                            onClick={importMembers}
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
                                    <CheckCircle2 size={16} /> Import {parsedMembers.length} Members
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkMemberUpload;

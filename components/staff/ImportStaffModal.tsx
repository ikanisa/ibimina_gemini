/**
 * Import Staff Modal Component
 * 
 * AI-powered bulk staff import wizard
 */

import React, { useState, useRef } from 'react';
import {
    Sparkles, X, Upload, FileText, FileSpreadsheet,
    Check, AlertCircle
} from 'lucide-react';
import { StaffRole } from '../../types';

type ImportStep = 'upload' | 'processing' | 'review' | 'success';

interface ParsedCandidate {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    branch: string;
    confidence: number;
}

interface ImportStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (candidates: ParsedCandidate[]) => void;
}

export const ImportStaffModal: React.FC<ImportStaffModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [importStep, setImportStep] = useState<ImportStep>('upload');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState('');
    const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportStep('processing');
        setUploadProgress(10);
        setProcessingStatus('Uploading document...');

        setTimeout(() => {
            setUploadProgress(40);
            setProcessingStatus('AI analyzing document structure...');
        }, 800);

        setTimeout(() => {
            setUploadProgress(70);
            setProcessingStatus('Extracting staff entities and roles...');
        }, 2000);

        setTimeout(() => {
            setUploadProgress(100);
            setProcessingStatus('Finalizing data mapping...');

            const mockParsed: ParsedCandidate[] = [
                { id: 'tmp-1', name: 'Robert Niza', email: 'robert.n@saccoplus.rw', role: 'Staff', branch: 'Kigali Main', confidence: 98 },
                { id: 'tmp-2', name: 'Claire Uwimana', email: 'claire.u@saccoplus.rw', role: 'Staff', branch: 'Musanze Branch', confidence: 95 },
                { id: 'tmp-3', name: 'Peter S.', email: 'peter.s@gmail.com', role: 'Admin', branch: 'Headquarters', confidence: 82 },
            ];

            setParsedCandidates(mockParsed);
            setImportStep('review');
        }, 3000);
    };

    const handleImportConfirm = () => {
        setImportStep('success');
        setTimeout(() => {
            onSuccess(parsedCandidates);
            handleClose();
        }, 2000);
    };

    const handleClose = () => {
        setImportStep('upload');
        setUploadProgress(0);
        setParsedCandidates([]);
        onClose();
    };

    const updateCandidate = (id: string, field: keyof ParsedCandidate, value: string) => {
        setParsedCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeCandidate = (id: string) => {
        setParsedCandidates(prev => prev.filter(c => c.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-modal-title"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 id="import-modal-title" className="font-bold text-slate-900">AI Staff Import</h3>
                            <p className="text-xs text-slate-500">Upload PDF, Excel, or Image rosters</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                        aria-label="Close import modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {importStep === 'upload' && (
                        <div
                            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-10 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer h-64"
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                            aria-label="Click to upload file"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.csv,.xlsx,.png,.jpg"
                                onChange={handleFileUpload}
                                aria-label="File upload"
                            />
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-blue-600">
                                <Upload size={32} />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-1">Click to upload or drag and drop</h4>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Support for PDF staff lists, Excel rosters, or scanned images of employee forms.
                            </p>
                            <div className="flex gap-2 mt-6">
                                <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded flex items-center gap-1">
                                    <FileText size={12} /> PDF
                                </span>
                                <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded flex items-center gap-1">
                                    <FileSpreadsheet size={12} /> Excel
                                </span>
                            </div>
                        </div>
                    )}

                    {importStep === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={32} className="text-purple-500 animate-pulse" />
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Processing Document</h4>
                            <p className="text-slate-500 text-sm mb-8" aria-live="polite">{processingStatus}</p>

                            <div
                                className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={uploadProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div
                                    className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {importStep === 'review' && (
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Review Extracted Data</h4>
                                    <p className="text-xs text-slate-500">
                                        The AI found {parsedCandidates.length} potential staff members. Please verify details.
                                    </p>
                                </div>
                                <div className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                    <Check size={12} /> AI Confidence High
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Branch</th>
                                            <th className="px-4 py-3 font-medium text-slate-500 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedCandidates.map((candidate) => (
                                            <tr key={candidate.id} className="group hover:bg-blue-50/30">
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={candidate.name}
                                                        onChange={(e) => updateCandidate(candidate.id, 'name', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                                                        aria-label={`Name for ${candidate.name}`}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={candidate.email}
                                                        onChange={(e) => updateCandidate(candidate.id, 'email', e.target.value)}
                                                        className={`w-full bg-transparent border border-transparent hover:border-slate-300 rounded px-2 py-1 outline-none ${!candidate.email.includes('@') ? 'text-red-600 bg-red-50' : ''
                                                            }`}
                                                        aria-label={`Email for ${candidate.name}`}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={candidate.role}
                                                        onChange={(e) => updateCandidate(candidate.id, 'role', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-1 outline-none text-sm"
                                                        aria-label={`Role for ${candidate.name}`}
                                                    >
                                                        <option>Staff</option>
                                                        <option>Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={candidate.branch}
                                                        onChange={(e) => updateCandidate(candidate.id, 'branch', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                                                        aria-label={`Branch for ${candidate.name}`}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => removeCandidate(candidate.id)}
                                                        className="text-slate-300 hover:text-red-500"
                                                        aria-label={`Remove ${candidate.name}`}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                <AlertCircle size={14} className="text-amber-500" />
                                <span>Rows highlighted in red may contain errors.</span>
                            </div>
                        </div>
                    )}

                    {importStep === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <Check size={40} />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-800">Import Successful</h4>
                            <p className="text-slate-500 mt-2">
                                {parsedCandidates.length} new staff members have been added to the system pending final activation.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {importStep === 'review' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                        <button
                            onClick={() => setImportStep('upload')}
                            className="text-slate-500 text-sm font-medium hover:text-slate-700"
                        >
                            Back to Upload
                        </button>
                        <button
                            onClick={handleImportConfirm}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Import {parsedCandidates.length} Staff Members
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportStaffModal;

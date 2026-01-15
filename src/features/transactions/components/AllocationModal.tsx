import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Users, Check, Loader2, AlertCircle } from 'lucide-react';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import { useAllocateTransaction } from '@/hooks/useAllocateTransaction';
import { Button, SearchInput } from '@/shared/components/ui';

interface AllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
    isOpen,
    onClose,
    transactionId,
    amount,
    currency,
    onSuccess
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { data: searchResults, isLoading: isSearching } = useMemberSearch(searchTerm);
    const { allocate, isAllocating } = useAllocateTransaction();

    const handleAllocate = async () => {
        if (!selectedMember) return;
        setError(null);

        try {
            await allocate({
                transactionId,
                memberId: selectedMember.id,
                note: note.trim() || undefined
            });
            onSuccess();
            onClose();
            // Reset state based on success
            setSearchTerm('');
            setSelectedMember(null);
            setNote('');
        } catch (err: any) {
            setError(err.message || 'Failed to allocate transaction');
        }
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-semibold text-slate-900">
                                Allocate Transaction
                            </Dialog.Title>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="text-sm text-slate-500 mb-1">Transaction Amount</div>
                            <div className="text-2xl font-bold text-slate-900">
                                {amount.toLocaleString()} <span className="text-sm font-medium text-slate-500">{currency}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                                <AlertCircle size={16} className="mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Find Member
                                </label>
                                <SearchInput
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (!e.target.value) setSelectedMember(null);
                                    }}
                                    onClear={() => {
                                        setSearchTerm('');
                                        setSelectedMember(null);
                                    }}
                                    placeholder="Search by name or phone"
                                    className="w-full"
                                />

                                {/* Search Results Dropdown */}
                                {searchTerm.length >= 2 && !selectedMember && (
                                    <div className="mt-1 border border-slate-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-slate-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                                                <span className="text-xs">Searching...</span>
                                            </div>
                                        ) : searchResults?.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500">
                                                No members found
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-slate-100">
                                                {searchResults?.map((member) => (
                                                    <li
                                                        key={member.id}
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setSearchTerm(member.full_name);
                                                        }}
                                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{member.full_name}</div>
                                                                <div className="text-xs text-slate-500">{member.phone}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-400 group-hover:text-blue-500">
                                                            Select
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedMember && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Check className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-900">Selected Member</div>
                                            <div className="text-sm text-blue-800">{selectedMember.full_name}</div>
                                            {selectedMember.groups?.name && (
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700">
                                                    <Users size={12} />
                                                    <span>{selectedMember.groups.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    rows={3}
                                    placeholder="Review for contribution..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    className="flex-1"
                                    disabled={isAllocating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAllocate}
                                    className="flex-1"
                                    isLoading={isAllocating}
                                    disabled={!selectedMember || isAllocating}
                                >
                                    Confirm Allocation
                                </Button>
                            </div>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

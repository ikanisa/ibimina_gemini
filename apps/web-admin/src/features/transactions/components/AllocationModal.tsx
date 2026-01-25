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
                    <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-neutral-100">
                                Allocate Transaction
                            </Dialog.Title>
                            <button
                                onClick={onClose}
                                className="text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="text-sm text-slate-500 dark:text-neutral-400 mb-1">Transaction Amount</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                                {amount.toLocaleString()} <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">{currency}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                                <AlertCircle size={16} className="mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
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
                                    <div className="mt-1 border border-slate-200 dark:border-neutral-700 rounded-lg max-h-48 overflow-y-auto shadow-lg bg-white dark:bg-neutral-800">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-slate-500 dark:text-neutral-400">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                                                <span className="text-xs">Searching...</span>
                                            </div>
                                        ) : searchResults?.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500 dark:text-neutral-400">
                                                No members found
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-slate-100 dark:divide-neutral-700">
                                                {searchResults?.map((member) => (
                                                    <li
                                                        key={member.id}
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setSearchTerm(member.full_name);
                                                        }}
                                                        className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900 dark:text-neutral-100">{member.full_name}</div>
                                                                <div className="text-xs text-slate-500 dark:text-neutral-400">{member.phone}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-400 dark:text-neutral-500 group-hover:text-blue-500 dark:group-hover:text-blue-400">
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
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-900 dark:text-blue-300">Selected Member</div>
                                            <div className="text-sm text-blue-800 dark:text-blue-400">{selectedMember.full_name}</div>
                                            {selectedMember.groups?.name && (
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700 dark:text-blue-500">
                                                    <Users size={12} />
                                                    <span>{selectedMember.groups.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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

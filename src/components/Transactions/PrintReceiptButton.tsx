/**
 * Print Receipt Button Component
 * Allows users to print transaction receipts
 */

import React, { useState } from 'react';
import { Printer, Loader, FileText } from 'lucide-react';
import { printReceipt, transactionToReceiptData } from '../../lib/utils/receipt';
import type { ConsolidatedTransaction } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface PrintReceiptButtonProps {
    transaction: ConsolidatedTransaction;
    institutionName: string;
    variant?: 'button' | 'icon';
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PrintReceiptButton: React.FC<PrintReceiptButtonProps> = ({
    transaction,
    institutionName,
    variant = 'button',
    className = '',
}) => {
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        setPrinting(true);

        try {
            // Small delay for UX
            await new Promise((resolve) => setTimeout(resolve, 200));

            const receiptData = transactionToReceiptData(
                {
                    id: transaction.id,
                    created_at: transaction.created_at,
                    occurred_at: transaction.occurred_at,
                    transaction_type: transaction.transaction_type,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    channel: transaction.channel,
                    momo_ref: transaction.momo_ref,
                    member_name: transaction.member_name,
                    payer_name: transaction.payer_name,
                    group_name: transaction.group_name,
                },
                institutionName
            );

            printReceipt(receiptData);
        } finally {
            setPrinting(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handlePrint}
                disabled={printing}
                className={`
          p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100
          rounded-lg transition-colors disabled:opacity-50
          ${className}
        `}
                title="Print Receipt"
                aria-label="Print receipt"
            >
                {printing ? (
                    <Loader size={18} className="animate-spin" />
                ) : (
                    <Printer size={18} />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handlePrint}
            disabled={printing}
            className={`
        inline-flex items-center gap-2
        px-4 py-2
        bg-white border border-slate-300
        text-slate-700 rounded-lg font-medium
        hover:bg-slate-50 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
        >
            {printing ? (
                <>
                    <Loader size={18} className="animate-spin" />
                    <span>Printing...</span>
                </>
            ) : (
                <>
                    <Printer size={18} />
                    <span>Print Receipt</span>
                </>
            )}
        </button>
    );
};

// ============================================================================
// RECEIPT PREVIEW MODAL
// ============================================================================

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: ConsolidatedTransaction;
    institutionName: string;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
    isOpen,
    onClose,
    transaction,
    institutionName,
}) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        const receiptData = transactionToReceiptData(
            {
                id: transaction.id,
                created_at: transaction.created_at,
                occurred_at: transaction.occurred_at,
                transaction_type: transaction.transaction_type,
                amount: transaction.amount,
                currency: transaction.currency,
                channel: transaction.channel,
                momo_ref: transaction.momo_ref,
                member_name: transaction.member_name,
                payer_name: transaction.payer_name,
                group_name: transaction.group_name,
            },
            institutionName
        );

        printReceipt(receiptData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">Print Receipt</h2>
                        <p className="text-sm text-slate-500">Transaction #{transaction.id.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-semibold">
                            {new Intl.NumberFormat('en-RW', {
                                style: 'currency',
                                currency: transaction.currency,
                            }).format(transaction.amount)}
                        </span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500">Type</span>
                        <span>{transaction.transaction_type}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Member</span>
                        <span>{transaction.member_name || transaction.payer_name || 'N/A'}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintReceiptButton;

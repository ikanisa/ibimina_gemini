/**
 * Transaction Export Button Component
 * Allows users to export transaction data to CSV
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader } from 'lucide-react';
import { exportTransactionsToCsv } from '@/lib/utils/export';
import type { ConsolidatedTransaction } from '@/core/types';

// ============================================================================
// TYPES
// ============================================================================

interface TransactionExportProps {
    transactions: ConsolidatedTransaction[];
    disabled?: boolean;
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TransactionExport: React.FC<TransactionExportProps> = ({
    transactions,
    disabled = false,
    className = '',
}) => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (transactions.length === 0) {
            return;
        }

        setExporting(true);

        try {
            // Small delay for UX feedback
            await new Promise((resolve) => setTimeout(resolve, 300));

            const exportData = transactions.map((txn) => ({
                id: txn.id,
                created_at: txn.created_at,
                occurred_at: txn.occurred_at,
                momo_ref: txn.momo_ref,
                transaction_type: txn.transaction_type,
                member_name: txn.member_name,
                payer_name: txn.payer_name,
                group_name: txn.group_name,
                amount: txn.amount,
                currency: txn.currency,
                channel: txn.channel,
                transaction_status: txn.transaction_status,
            }));

            exportTransactionsToCsv(exportData);
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || exporting || transactions.length === 0}
            className={`
        inline-flex items-center gap-2 
        px-4 py-2 
        bg-white border border-slate-300 
        text-slate-700 
        rounded-lg font-medium
        hover:bg-slate-50 
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
            title={transactions.length === 0 ? 'No transactions to export' : 'Export to CSV'}
        >
            {exporting ? (
                <>
                    <Loader size={18} className="animate-spin" />
                    <span>Exporting...</span>
                </>
            ) : (
                <>
                    <Download size={18} />
                    <span>Export CSV</span>
                </>
            )}
        </button>
    );
};

/**
 * Export dropdown with multiple format options
 */
export const TransactionExportMenu: React.FC<TransactionExportProps> = ({
    transactions,
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportCsv = async () => {
        setExporting(true);
        setIsOpen(false);

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const exportData = transactions.map((txn) => ({
                id: txn.id,
                created_at: txn.created_at,
                occurred_at: txn.occurred_at,
                momo_ref: txn.momo_ref,
                transaction_type: txn.transaction_type,
                member_name: txn.member_name,
                payer_name: txn.payer_name,
                group_name: txn.group_name,
                amount: txn.amount,
                currency: txn.currency,
                channel: txn.channel,
                transaction_status: txn.transaction_status,
            }));

            exportTransactionsToCsv(exportData);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || exporting || transactions.length === 0}
                className="
          inline-flex items-center gap-2 
          px-4 py-2 
          bg-white border border-slate-300 
          text-slate-700 
          rounded-lg font-medium
          hover:bg-slate-50 
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                {exporting ? (
                    <Loader size={18} className="animate-spin" />
                ) : (
                    <Download size={18} />
                )}
                <span>Export</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                        <button
                            onClick={handleExportCsv}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <FileSpreadsheet size={16} />
                            Export as CSV
                        </button>
                        {/* PDF export can be added here in the future */}
                    </div>
                </>
            )}
        </div>
    );
};

export default TransactionExport;

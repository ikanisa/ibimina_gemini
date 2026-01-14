/**
 * Bulk Actions Component for Transactions
 * 
 * Provides bulk operations on selected transactions:
 * - Bulk allocate
 * - Bulk flag
 * - Bulk export
 * - Bulk delete (if permitted)
 */

import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Flag, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { handleError, getUserFriendlyMessage } from '../../lib/errors/ErrorHandler';
import { captureError } from '../../lib/sentry';

interface BulkActionsProps {
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onBulkActionComplete?: () => void;
  totalCount?: number;
  className?: string;
}

type BulkAction = 'allocate' | 'flag' | 'export' | 'delete';

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onSelectionChange,
  onBulkActionComplete,
  totalCount,
  className = '',
}) => {
  const { institutionId, user } = useAuth();
  const [processing, setProcessing] = useState<BulkAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  // Select all / Deselect all
  const handleSelectAll = () => {
    // This would need access to all transaction IDs
    // For now, we'll just clear selection
    onSelectionChange(new Set());
  };

  const handleDeselectAll = () => {
    onSelectionChange(new Set());
  };

  // Bulk allocate transactions
  const handleBulkAllocate = async () => {
    if (selectedIds.size === 0) return;

    setProcessing('allocate');
    setError(null);

    try {
      // For bulk allocation, we'd typically allocate to a specific member/group
      // This is a placeholder - actual implementation would need a member/group selection UI
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          allocation_status: 'allocated',
          allocated_at: new Date().toISOString(),
          allocated_by: user?.id || null,
        })
        .in('id', Array.from(selectedIds));

      if (updateError) throw updateError;

      onSelectionChange(new Set());
      onBulkActionComplete?.();
    } catch (err) {
      const appError = handleError(err, {
        component: 'BulkActions',
        operation: 'bulkAllocate',
        institutionId,
      });
      setError(getUserFriendlyMessage(appError));
      captureError(err, {
        component: 'BulkActions',
        operation: 'bulkAllocate',
        selectedCount: selectedIds.size,
      });
    } finally {
      setProcessing(null);
    }
  };

  // Bulk flag transactions
  const handleBulkFlag = async () => {
    if (selectedIds.size === 0) return;

    setProcessing('flag');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          allocation_status: 'flagged',
          allocated_at: new Date().toISOString(),
          allocated_by: user?.id || null,
        })
        .in('id', Array.from(selectedIds));

      if (updateError) throw updateError;

      onSelectionChange(new Set());
      onBulkActionComplete?.();
    } catch (err) {
      const appError = handleError(err, {
        component: 'BulkActions',
        operation: 'bulkFlag',
        institutionId,
      });
      setError(getUserFriendlyMessage(appError));
      captureError(err, {
        component: 'BulkActions',
        operation: 'bulkFlag',
        selectedCount: selectedIds.size,
      });
    } finally {
      setProcessing(null);
    }
  };

  // Bulk export transactions
  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return;

    setProcessing('export');
    setError(null);

    try {
      // Fetch selected transactions
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .in('id', Array.from(selectedIds));

      if (fetchError) throw fetchError;

      // Use enhanced CSV export
      const { exportTransactions } = await import('../../lib/csv/export');
      exportTransactions(data || [], {
        filename: `transactions_${new Date().toISOString().split('T')[0]}.csv`,
      });

      onSelectionChange(new Set());
    } catch (err) {
      const appError = handleError(err, {
        component: 'BulkActions',
        operation: 'bulkExport',
        institutionId,
      });
      setError(getUserFriendlyMessage(appError));
      captureError(err, {
        component: 'BulkActions',
        operation: 'bulkExport',
        selectedCount: selectedIds.size,
      });
    } finally {
      setProcessing(null);
    }
  };

  // Bulk delete transactions (if permitted)
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} transaction(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setProcessing('delete');
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (deleteError) throw deleteError;

      onSelectionChange(new Set());
      onBulkActionComplete?.();
    } catch (err) {
      const appError = handleError(err, {
        component: 'BulkActions',
        operation: 'bulkDelete',
        institutionId,
      });
      setError(getUserFriendlyMessage(appError));
      captureError(err, {
        component: 'BulkActions',
        operation: 'bulkDelete',
        selectedCount: selectedIds.size,
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!hasSelection && !error) {
    return null;
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
          </span>
          {selectedCount > 0 && (
            <button
              onClick={handleDeselectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleBulkAllocate}
            disabled={!hasSelection || processing !== null}
            variant="primary"
            size="sm"
          >
            {processing === 'allocate' ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Allocating...
              </>
            ) : (
              'Allocate'
            )}
          </Button>

          <Button
            onClick={handleBulkFlag}
            disabled={!hasSelection || processing !== null}
            variant="secondary"
            size="sm"
          >
            {processing === 'flag' ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Flagging...
              </>
            ) : (
              <>
                <Flag size={16} className="mr-2" />
                Flag
              </>
            )}
          </Button>

          <Button
            onClick={handleBulkExport}
            disabled={!hasSelection || processing !== null}
            variant="secondary"
            size="sm"
          >
            {processing === 'export' ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Export
              </>
            )}
          </Button>

          <Button
            onClick={handleBulkDelete}
            disabled={!hasSelection || processing !== null}
            variant="danger"
            size="sm"
          >
            {processing === 'delete' ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

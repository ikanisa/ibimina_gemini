/**
 * Transactions Feature Module
 * 
 * Exports all transaction-related components, hooks, and services.
 */

// Components
export { default as Transactions } from './components/Transactions';
export { TransactionDrawer } from './components/TransactionDrawer';
export { AllocationModal } from './components/AllocationModal';
export { BulkActions } from './components/BulkActions';
export { BulkAllocationModal } from './components/BulkAllocationModal';
export { DragDropAllocation } from './components/DragDropAllocation';
export { PrintReceiptButton } from './components/PrintReceiptButton';
export { TransactionExport } from './components/TransactionExport';
export { TransactionsSkeleton } from './components/TransactionsSkeleton';
export { UnallocatedQueue } from './components/UnallocatedQueue';
export { VirtualizedTransactionTable } from './components/VirtualizedTransactionTable';

// Hooks (legacy)
export { useTransactions } from './hooks/useTransactions';
export { useTransactionsPaginated } from './hooks/useTransactionsPaginated';
export { useAllocateTransaction } from './hooks/useAllocateTransaction';

// Hooks (V2 - standardized)
export {
    useTransactionsV2,
    useTransactionDetail,
    useCreateTransaction,
    useUpdateTransactionStatus,
    useAllocateTransactionV2,
    useBatchAllocateTransactions,
    useUnallocatedCount,
    transactionKeys,
} from './hooks/useTransactionsV2';

// Services
export { transactionService } from './services/transactionService';
export type {
    TransactionFilters,
    CreateTransactionInput,
    AllocateTransactionInput,
    TransactionWithRelations,
} from './services/transactionService';

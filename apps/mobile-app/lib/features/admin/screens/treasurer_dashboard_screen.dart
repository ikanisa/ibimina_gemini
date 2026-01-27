import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/ledger/providers/ledger_providers.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:intl/intl.dart';

class TreasurerDashboardScreen extends ConsumerWidget {
  final String groupId;

  const TreasurerDashboardScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(groupTransactionsProvider(groupId));

    return AppScaffold(
      appBar: AppBar(title: const Text('Treasurer Dashboard')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(groupTransactionsProvider(groupId)),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeader(title: 'Pending Approvals'),
              const SizedBox(height: AppSpacing.sm),
              transactionsAsync.when(
                data: (transactions) {
                  final pending = transactions.where((t) => t.status == 'pending').toList();

                  if (pending.isEmpty) {
                    return const EmptyState(
                      icon: Icons.check_circle_outline,
                      title: 'All caught up!',
                      message: 'No pending contributions to review.',
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: pending.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, index) => _ApprovalCard(transaction: pending[index]),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ApprovalCard extends ConsumerStatefulWidget {
  final Transaction transaction;

  const _ApprovalCard({required this.transaction});

  @override
  ConsumerState<_ApprovalCard> createState() => _ApprovalCardState();
}

class _ApprovalCardState extends ConsumerState<_ApprovalCard> {
  bool _isProcessing = false;

  Future<void> _approve() async {
    setState(() => _isProcessing = true);
    try {
      final service = LedgerService();
      await service.approveTransaction(widget.transaction.id);
      if (widget.transaction.groupId != null) {
        ref.invalidate(groupTransactionsProvider(widget.transaction.groupId!));
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contribution Approved'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _reject() async {
     setState(() => _isProcessing = true);
    try {
      final service = LedgerService();
      await service.rejectTransaction(widget.transaction.id);
      if (widget.transaction.groupId != null) {
        ref.invalidate(groupTransactionsProvider(widget.transaction.groupId!));
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contribution Rejected'), backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'RWF ', decimalDigits: 0);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          )
        ]
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Member ID: ...${(widget.transaction.memberId ?? 'Unknown').substring(0, 6)}', // Masked for brevity
                      style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      currencyFormat.format(widget.transaction.amount),
                      style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              if (widget.transaction.transactionId != null)
                StatusPill(label: 'Tx: ${widget.transaction.transactionId}', color: AppColors.info),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (widget.transaction.proofUrl != null) ...[
             // In real app, show image preview or link
             Row(
               children: [
                 const Icon(Icons.image, size: 16, color: AppColors.textSecondary),
                 const SizedBox(width: 4),
                 Text('Proof Attached', style: AppTypography.bodySmall),
               ],
             ),
             const SizedBox(height: AppSpacing.md),
          ],

          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Reject',
                  icon: Icons.close,
                  color: AppColors.error,
                  isLoading: _isProcessing,
                  onPressed: _isProcessing ? null : _reject,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: PrimaryButton(
                  label: 'Approve',
                  icon: Icons.check,
                  isLoading: _isProcessing,
                  onPressed: _isProcessing ? null : _approve,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

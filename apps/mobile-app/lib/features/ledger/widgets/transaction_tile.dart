import 'package:flutter/material.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:intl/intl.dart';
import 'package:ibimina_mobile/features/support/screens/fix_rejected_submission_screen.dart';
import 'package:ibimina_mobile/features/support/screens/why_pending_sheet.dart';

class TransactionTile extends StatelessWidget {
  final Transaction transaction;

  const TransactionTile({
    super.key,
    required this.transaction,
  });

  @override
  Widget build(BuildContext context) {
    // In "Savings Wallet", everything is a "Contribution" (deposit).
    // If we ever support withdrawals, we'd handle it, but per rules we don't show "Withdrawal" UI prominence.
    final isDeposit = transaction.type == 'deposit';
    final statusColor = _getStatusColor(transaction.status);
    final currencySymbol = transaction.currency == 'RWF' ? 'RWF ' : '\$';
    
    final formattedAmount = NumberFormat.currency(
      symbol: currencySymbol,
      decimalDigits: 0,
    ).format(transaction.amount);

    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(AppRadius.md),
       // Subtle border for clean separation
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: BorderSide(color: AppColors.border.withValues(alpha: 0.3), width: 0.5),
      ),
      child: InkWell(
        onTap: () => _handleTap(context),
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Icon Container
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDeposit 
                      ? AppColors.primary.withValues(alpha: 0.1) 
                      : AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  isDeposit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                  color: isDeposit ? AppColors.primary : AppColors.error,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              
              // Title & Date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isDeposit ? 'Contribution' : 'Transaction', // Generic fallback
                      style: AppTypography.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatDate(transaction.createdAt),
                      style: AppTypography.bodySmall,
                    ),
                  ],
                ),
              ),
              
              // Amount & Status
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formattedAmount,
                    style: AppTypography.titleSmall.copyWith(
                      color: isDeposit ? AppColors.success : AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (transaction.status == 'rejected')
                    Text(
                      'Tap to Fix',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  else
                      StatusPill(
                        label: transaction.status.toUpperCase(),
                        color: statusColor,
                      ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleTap(BuildContext context) {
    if (transaction.status == 'rejected') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => FixRejectedSubmissionScreen(
            transaction: transaction,
          ),
        ),
      );
    } else if (transaction.status == 'pending') {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (context) => WhyPendingSheet(submissionId: transaction.id),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return AppColors.success;
      case 'pending':
        return AppColors.warning;
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      return 'Today, ${DateFormat.jm().format(date)}';
    }
    return DateFormat.MMMd().format(date);
  }
}

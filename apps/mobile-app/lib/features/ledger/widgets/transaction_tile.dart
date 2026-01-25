import 'package:flutter/material.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
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
    final isDeposit = transaction.type == 'deposit';
    final statusColor = _getStatusColor(transaction.status);
    final formattedAmount = NumberFormat.currency(
      symbol: transaction.currency == 'RWF' ? 'RWF ' : '\$',
      decimalDigits: 0,
    ).format(transaction.amount);

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => _handleTap(context),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (isDeposit ? AppColors.success : AppColors.warning).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isDeposit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                  color: isDeposit ? AppColors.success : AppColors.warning,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isDeposit ? 'Contribution' : 'Withdrawal',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            transaction.status.toUpperCase(),
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(transaction.createdAt),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.darkTextSecondary,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formattedAmount,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isDeposit ? AppColors.success : AppColors.darkTextPrimary,
                        ),
                  ),
                  if (transaction.status == 'rejected')
                    Text(
                      'Tap to fix',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
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
        return AppColors.darkTextSecondary;
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

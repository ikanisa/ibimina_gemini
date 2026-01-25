import 'package:flutter/material.dart';
import '../../ui/tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/radius.dart';

/// Status indicator for ledger entries and transactions.
/// 
/// Usage:
/// ```dart
/// StatusPill(status: TransactionStatus.pending)
/// StatusPill.pending()
/// StatusPill.confirmed()
/// StatusPill.rejected()
/// ```
class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  /// Creates a pending status pill.
  factory StatusPill.pending() => const StatusPill(
        label: 'Pending',
        color: AppColors.warning,
        icon: Icons.schedule,
      );

  /// Creates a confirmed status pill.
  factory StatusPill.confirmed() => const StatusPill(
        label: 'Confirmed',
        color: AppColors.success,
        icon: Icons.check_circle_outline,
      );

  /// Creates a rejected status pill.
  factory StatusPill.rejected() => const StatusPill(
        label: 'Rejected',
        color: AppColors.error,
        icon: Icons.cancel_outlined,
      );

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha:0.15),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

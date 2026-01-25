import 'package:flutter/material.dart';
import '../tokens/spacing.dart';

/// Large balance display header.
/// 
/// Usage:
/// ```dart
/// BalanceHeader(
///   label: 'Wallet Balance',
///   amount: '125,000',
///   currency: 'RWF',
/// )
/// ```
class BalanceHeader extends StatelessWidget {
  const BalanceHeader({
    super.key,
    required this.label,
    required this.amount,
    this.currency = 'RWF',
    this.subtitle,
    this.textColor,
  });

  final String label;
  final String amount;
  final String currency;
  final String? subtitle;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    return Column(
      children: [
        Text(
          label.toUpperCase(),
          style: theme.textTheme.labelMedium?.copyWith(
            color: textColor?.withValues(alpha:0.7) ?? colorScheme.onSurface.withValues(alpha:0.7),
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: Spacing.xs),
        RichText(
          text: TextSpan(
            style: theme.textTheme.displayLarge?.copyWith(
              color: textColor ?? colorScheme.onSurface,
            ),
            children: [
              TextSpan(
                text: currency,
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: textColor?.withValues(alpha:0.5) ?? colorScheme.onSurface.withValues(alpha:0.5),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const TextSpan(text: ' '),
              TextSpan(text: amount),
            ],
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: Spacing.xs),
          Text(
            subtitle!,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: textColor?.withValues(alpha:0.7) ?? colorScheme.onSurface.withValues(alpha:0.7),
            ),
          ),
        ],
      ],
    );
  }
}

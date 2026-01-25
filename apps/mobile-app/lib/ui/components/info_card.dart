import 'package:flutter/material.dart';
import '../tokens/spacing.dart';
import '../tokens/radius.dart';

/// Generic info card with title, subtitle, and optional trailing widget.
/// 
/// Usage:
/// ```dart
/// InfoCard(
///   title: 'Account Balance',
///   subtitle: 'Last updated 2 mins ago',
///   trailing: Icon(Icons.chevron_right),
///   onTap: () => Navigator.push(...),
/// )
/// ```
class InfoCard extends StatelessWidget {
  const InfoCard({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.padding,
    this.backgroundColor,
    this.borderColor,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsets? padding;
  final Color? backgroundColor;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Material(
      color: backgroundColor ?? colorScheme.surface,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          padding: padding ?? const EdgeInsets.all(Spacing.cardPadding),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: borderColor ?? colorScheme.outline.withValues(alpha:0.5),
              width: 0.5,
            ),
          ),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: Spacing.ms),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall,
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: Spacing.xs),
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: Spacing.sm),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

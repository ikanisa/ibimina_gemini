import 'package:flutter/material.dart';
import '../tokens/spacing.dart';

/// Standard bottom sheet frame content wrapper.
/// 
/// Usage:
/// ```dart
/// result = await showModalBottomSheet(
///   context: context,
///   isScrollControlled: true,
///   builder: (_) => BottomSheetFrame(
///     title: 'Filters',
///     child: FilterForm(...),
///   ),
/// );
/// ```
class BottomSheetFrame extends StatelessWidget {
  const BottomSheetFrame({
    super.key,
    required this.child,
    this.title,
    this.action,
  });

  final Widget child;
  final String? title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaQuery = MediaQuery.of(context);
    
    // Calculate max height for safety (90% of screen)
    final maxHeight = mediaQuery.size.height * 0.9;
    
    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      padding: EdgeInsets.only(
        bottom: mediaQuery.viewInsets.bottom, // Keyboard handling
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header (if title exists)
          if (title != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Spacing.screenPadding,
                Spacing.sm, // reduced top padding due to drag handle
                Spacing.screenPadding,
                Spacing.md,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title!,
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  if (action != null) action!,
                ],
              ),
            ),
            
          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                Spacing.screenPadding,
                0,
                Spacing.screenPadding,
                Spacing.xl,
              ),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

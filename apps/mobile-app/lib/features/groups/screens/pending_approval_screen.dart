import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/ui.dart';

class PendingApprovalScreen extends StatelessWidget {
  const PendingApprovalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const EmptyState(
              icon: Icons.hourglass_top_rounded,
              title: 'Pending Approval',
              message: 'Your group is pending approval.',
            ),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'A staff member will review your group shortly. You will be notified once it is active.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.xxl),
            PrimaryButton(
              label: 'Back to Status',
              onPressed: () {
                // Refresh or go back to main check
                context.go('/group/view');
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextButton(
              onPressed: () {
                 // Maybe contact support?
              },
              child: const Text('Contact Support'),
            )
          ],
        ),
      ),
    );
  }
}

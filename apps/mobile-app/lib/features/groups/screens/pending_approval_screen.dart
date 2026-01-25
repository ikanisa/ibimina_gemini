import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/ui/components/app_scaffold.dart';

class PendingApprovalScreen extends ConsumerWidget {
  const PendingApprovalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Approval Pending')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.hourglass_empty,
                  size: 48,
                  color: AppColors.warning,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Group Pending Approval',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                'Your new public group is waiting for staff approval. Once approved, it will be visible in the directory and you can start inviting members.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              OutlinedButton(
                onPressed: () {
                  // TODO: Implement contact support or refresh check
                },
                child: const Text('Contact Support'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

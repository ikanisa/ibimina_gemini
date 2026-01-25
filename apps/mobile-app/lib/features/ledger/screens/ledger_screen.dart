import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/ledger/providers/ledger_providers.dart';
import 'package:ibimina_mobile/features/ledger/widgets/transaction_tile.dart';
import 'package:ibimina_mobile/features/contribution/screens/contribute_screen.dart';

class LedgerScreen extends ConsumerWidget {
  final String groupId;
  final String groupName;

  const LedgerScreen({
    super.key,
    required this.groupId,
    required this.groupName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(groupTransactionsProvider(groupId));

    return Scaffold(
      appBar: AppBar(
        title: Text(groupName),
      ),
      body: transactionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                'Could not load transactions',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(groupTransactionsProvider(groupId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (transactions) {
          if (transactions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  Text(
                    'No transactions yet',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Make your first contribution!',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: transactions.length,
            separatorBuilder: (_, i) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final tx = transactions[index];
              return TransactionTile(transaction: tx);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ContributeScreen(
                groupId: groupId,
                groupName: groupName,
              ),
            ),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Contribute'),
        backgroundColor: AppColors.primary,
      ),
    );
  }
}

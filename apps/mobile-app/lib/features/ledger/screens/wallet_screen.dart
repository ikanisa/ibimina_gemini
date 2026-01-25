import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/ledger/providers/ledger_providers.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';
import 'package:ibimina_mobile/features/ledger/widgets/transaction_tile.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart'; // Add this import
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:intl/intl.dart';

import 'package:ibimina_mobile/ui/tokens/colors.dart'; // Correct import

final periodProgressProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, groupId) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return {};
  
  // We need group rules first. 
  // Assuming the user is a member, get the group details.
  // Ideally we cache this or pass it in.
  // For now, fetch group from repo.
  final repo = ref.read(groupRepositoryProvider);
  final membership = await repo.getMyMembership((await repo.getMyInstitutionId())!);
  final group = membership.group; // Assuming membership expands group

  if (group == null) return {};

  final ledgerService = LedgerService();
  return ledgerService.getPeriodProgress(groupId, user.id, group.contributionAmount, group.frequency);
});


class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      return const Center(child: Text('Please log in to view wallet'));
    }

    final groupId = user.userMetadata?['group_id'] ?? '';
    final balanceAsync = ref.watch(walletBalanceProvider(user.id));
    final transactionsAsync = ref.watch(groupTransactionsProvider(groupId));
    final progressAsync = ref.watch(periodProgressProvider(groupId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wallet'),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
             ref.refresh(walletBalanceProvider(user.id).future),
             ref.refresh(groupTransactionsProvider(groupId).future),
             ref.refresh(periodProgressProvider(groupId).future),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance Card
              _buildBalanceCard(context, balanceAsync),
              
              const SizedBox(height: 24),

              // Period Progress Card (New)
              _buildPeriodProgress(context, progressAsync),

              const SizedBox(height: 24),
              
              // Transactions (Split Pending / History)
              _buildSectionTitle(context, 'Activity'),
              const SizedBox(height: 12),
              
              _buildTransactionsList(transactionsAsync),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildPeriodProgress(BuildContext context, AsyncValue<Map<String, dynamic>> progressAsync) {
    return progressAsync.when(
      data: (data) {
        final target = (data['target'] as num?)?.toDouble() ?? 0.0;
        if (target == 0) return const SizedBox.shrink(); // No rule set

        final current = (data['current'] as num?)?.toDouble() ?? 0.0;
        final frequency = data['frequency'] as String? ?? 'MONTHLY';
        
        final progress = (current / target).clamp(0.0, 1.0);
        final currencyFormat = NumberFormat.currency(symbol: 'RWF ', decimalDigits: 0);

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Text(
                     '${frequency == 'WEEKLY' ? 'Weekly' : 'Monthly'} Goal',
                     style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                   ),
                   Text(
                     '${currencyFormat.format(current)} / ${currencyFormat.format(target)}',
                     style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                   ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.surfaceVariant,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    progress >= 1.0 ? AppColors.success : AppColors.primary
                  ),
                  minHeight: 8,
                ),
              ),
              if (progress >= 1.0) ...[
                 const SizedBox(height: 8),
                 Row(
                   children: [
                     const Icon(Icons.check_circle, size: 16, color: AppColors.success),
                     const SizedBox(width: 4),
                     Text(
                       'Target reached!',
                       style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.success),
                     ),
                   ],
                 )
              ]
            ],
          ),
        );
      },
      loading: () => const SizedBox(height: 80, child: Center(child: CircularProgressIndicator())),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildBalanceCard(BuildContext context, AsyncValue<Map<String, double>> balanceAsync) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: balanceAsync.when(
        data: (balances) {
          final confirmed = balances['confirmed'] ?? 0.0;
          final pending = balances['pending'] ?? 0.0;
          final cap = 500000.0;
          final progress = (confirmed / cap).clamp(0.0, 1.0);
          final percent = (progress * 100).toInt();

          final currencyFormat = NumberFormat.currency(symbol: 'RWF ', decimalDigits: 0);

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Confirmed Balance',
                style: TextStyle(
                  color: Colors.white.withAlpha(204),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                currencyFormat.format(confirmed),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (pending > 0) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(51),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Pending: ${currencyFormat.format(pending)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Top-up limit',
                    style: TextStyle(
                      color: Colors.white.withAlpha(204),
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    '$percent% used',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.white.withAlpha(51),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Cap: ${currencyFormat.format(cap)}',
                  style: TextStyle(
                    color: Colors.white.withAlpha(153),
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
        error: (e, s) => const Text(
          'Could not load balance',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildTransactionsList(AsyncValue<dynamic> transactionsAsync) {
    return transactionsAsync.when(
      data: (transactions) {
        if (transactions.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Text(
                'No transactions yet',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
          );
        }

        final List<Transaction> allTx = transactions;
        final pending = allTx.where((t) => t.status == 'pending').toList();
        final history = allTx.where((t) => t.status != 'pending').toList();

        return Column(
          children: [
            if (pending.isNotEmpty) ...[
               Container(
                 width: double.infinity,
                 padding: const EdgeInsets.all(12),
                 decoration: BoxDecoration(
                   color: AppColors.warning.withValues(alpha: 0.05),
                   border: Border.all(color: AppColors.warning.withValues(alpha: 0.2)),
                   borderRadius: BorderRadius.circular(12),
                 ),
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     Row(
                       children: [
                         const Icon(Icons.hourglass_empty, size: 16, color: AppColors.warning),
                         const SizedBox(width: 8),
                         Text('Pending Confirmations (${pending.length})', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warning)),
                       ],
                     ),
                     const SizedBox(height: 8),
                     ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: pending.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) => TransactionTile(transaction: pending[i]),
                     ),
                   ],
                 ),
               ),
               const SizedBox(height: 24),
            ],
            
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: history.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return TransactionTile(transaction: history[index]);
              },
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Text('Error: $e'),
    );
  }
}

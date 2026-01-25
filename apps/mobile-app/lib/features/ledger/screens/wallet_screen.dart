import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:ibimina_mobile/features/ledger/providers/ledger_providers.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';
import 'package:ibimina_mobile/features/ledger/widgets/transaction_tile.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:intl/intl.dart';

// Provider definitions (kept near usage for now, but ideally in separate file)
final periodProgressProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, groupId) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return {};
  
  final repo = ref.read(groupRepositoryProvider);
  final membership = await repo.getMyMembership((await repo.getMyInstitutionId())!);
  final group = membership.group; 

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
      return const AppScaffold(body: Center(child: Text('Please log in')));
    }

    final groupId = user.userMetadata?['group_id'] ?? '';
    final balanceAsync = ref.watch(walletBalanceProvider(user.id));
    final transactionsAsync = ref.watch(groupTransactionsProvider(groupId));
    final progressAsync = ref.watch(periodProgressProvider(groupId));

    return AppScaffold(
      appBar: AppBar(title: const Text('My Savings')),
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
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Balance & Cap Card
              _buildBalanceCard(context, balanceAsync),
              
              const SizedBox(height: AppSpacing.lg),

              // Period Progress
              _buildPeriodProgress(context, progressAsync),

              const SizedBox(height: AppSpacing.xl),
              
              // Transactions
              _buildTransactionsList(context, transactionsAsync),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, AsyncValue<Map<String, double>> balanceAsync) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: balanceAsync.when(
        data: (balances) {
          final confirmed = balances['confirmed'] ?? 0.0;
          final cap = 500000.0;
          final progress = (confirmed / cap).clamp(0.0, 1.0);
          final percent = (progress * 100).toInt();

          final currencyFormat = NumberFormat.currency(symbol: 'RWF ', decimalDigits: 0);

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Confirmed Savings',
                style: AppTypography.labelMedium.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                currencyFormat.format(confirmed),
                style: AppTypography.displaySmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              
              // Cap Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Wallet Limit',
                    style: AppTypography.bodySmall.copyWith(color: Colors.white70),
                  ),
                  Text(
                    '${currencyFormat.format(cap)}',
                    style: AppTypography.bodySmall.copyWith(color: Colors.white70, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  '$percent% used',
                  style: AppTypography.labelSmall.copyWith(color: Colors.white),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
        error: (_, __) => const Text('Error loading balance', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildPeriodProgress(BuildContext context, AsyncValue<Map<String, dynamic>> progressAsync) {
    return progressAsync.when(
      data: (data) {
        final target = (data['target'] as num?)?.toDouble() ?? 0.0;
        if (target == 0) return const SizedBox.shrink();

        final current = (data['current'] as num?)?.toDouble() ?? 0.0;
        final frequency = data['frequency'] as String? ?? 'MONTHLY';
        final progress = (current / target).clamp(0.0, 1.0);
        
        final currencyFormat = NumberFormat.currency(symbol: 'RWF ', decimalDigits: 0);

        return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Text(
                     '${frequency == 'WEEKLY' ? 'Weekly' : 'Monthly'} Target',
                     style: AppTypography.titleSmall,
                   ),
                   if (progress >= 1.0)
                     const StatusPill(label: 'GOAL MET', color: AppColors.success)
                   else
                     Text(
                       '${currencyFormat.format(current)} / ${currencyFormat.format(target)}',
                       style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.bold),
                     ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.lightSurfaceVariant,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    progress >= 1.0 ? AppColors.success : AppColors.primary
                  ),
                  minHeight: 8,
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildTransactionsList(BuildContext context, AsyncValue<dynamic> transactionsAsync) {
    return transactionsAsync.when(
      data: (transactions) {
        final List<Transaction> allTx = transactions;
        final pending = allTx.where((t) => t.status == 'pending').toList();
        final history = allTx.where((t) => t.status != 'pending').toList();

        if (allTx.isEmpty) {
          return const EmptyState(
            icon: Icons.account_balance_wallet_outlined,
            title: 'No activity yet',
            message: 'Your contributions will appear here.',
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // PENDING SECTION
            if (pending.isNotEmpty) ...[
               const SectionHeader(title: 'Pending Confirmations'),
               const SizedBox(height: AppSpacing.sm),
               Container(
                 decoration: BoxDecoration(
                   color: AppColors.warning.withValues(alpha: 0.05),
                   borderRadius: BorderRadius.circular(AppRadius.md),
                   border: Border.all(color: AppColors.warning.withValues(alpha: 0.2)),
                 ),
                 child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    itemCount: pending.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, i) => TransactionTile(transaction: pending[i]),
                 ),
               ),
               const SizedBox(height: AppSpacing.xl),
            ],
            
            // HISTORY SECTION
            if (history.isNotEmpty) ...[
               const SectionHeader(title: 'Transaction History'),
               const SizedBox(height: AppSpacing.sm),
               ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: history.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) => TransactionTile(transaction: history[i]),
               ),
            ],
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Text('Failed to load history: $e', style: const TextStyle(color: AppColors.error)),
    );
  }
}

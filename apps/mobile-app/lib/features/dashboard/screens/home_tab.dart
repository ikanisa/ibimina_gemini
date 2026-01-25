import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/dashboard/widgets/group_card.dart';
import 'package:ibimina_mobile/features/ledger/screens/ledger_screen.dart';
import 'package:ibimina_mobile/features/ledger/screens/wallet_screen.dart';
import 'package:ibimina_mobile/features/contribution/screens/contribute_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/scan_invite_screen.dart';

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupsAsync = ref.watch(userGroupsProvider);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Text(
              'Hello!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Your savings at a glance',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),

            // Quick Actions
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            // Row 1: Contribute, Wallet
            Row(
              children: [
                _QuickActionButton(
                  icon: Icons.add_circle_outline,
                  label: 'Contribute',
                  onTap: () {
                    if (groupsAsync case AsyncData(:final value) when value.isNotEmpty) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ContributeScreen(
                            groupId: value.first.id,
                            groupName: value.first.name,
                          ),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Join a group first')),
                      );
                    }
                  },
                ),
                const SizedBox(width: 12),
                _QuickActionButton(
                  icon: Icons.account_balance_wallet_outlined,
                  label: 'Wallet',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const WalletScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Row 2: History, Scan Invite
            Row(
              children: [
                _QuickActionButton(
                  icon: Icons.history,
                  label: 'History',
                  onTap: () {
                    if (groupsAsync case AsyncData(:final value) when value.isNotEmpty) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => LedgerScreen(
                            groupId: value.first.id,
                            groupName: value.first.name,
                          ),
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(width: 12),
                _QuickActionButton(
                  icon: Icons.qr_code_scanner,
                  label: 'Scan Invite',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ScanInviteScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // My Groups
            Text(
              'My Group',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),

            // Groups List
            Expanded(
              child: groupsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                      const SizedBox(height: 16),
                      Text(
                        'Could not load groups',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => ref.invalidate(userGroupsProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (groups) {
                  if (groups.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.groups_outlined, size: 64, color: AppColors.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            'No group yet',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Create or join a group to start saving',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              OutlinedButton(
                                onPressed: () {
                                  context.push('/group/join');
                                }, 
                                child: const Text('Join Group'),
                              ),
                             const SizedBox(width: 12),
                              ElevatedButton(
                                onPressed: () {
                                  context.push('/group/create');
                                },
                                child: const Text('Create Group'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }
                  return ListView.builder(
                    itemCount: groups.length,
                    itemBuilder: (context, index) {
                      final group = groups[index];
                      return GroupCard(
                        group: group,
                        onTap: () {
                          context.push('/group/view');
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Icon(icon, color: AppColors.primary, size: 28),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

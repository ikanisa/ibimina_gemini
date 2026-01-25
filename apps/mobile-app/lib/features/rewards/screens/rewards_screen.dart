import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart'; // For Clipboard
import 'package:ibimina_mobile/features/rewards/providers/rewards_providers.dart';
import 'package:ibimina_mobile/features/rewards/widgets/growth_action_card.dart';
import 'package:ibimina_mobile/features/rewards/widgets/leaderboard_widget.dart';
import 'package:ibimina_mobile/features/rewards/services/growth_service.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Leaderboard Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Top Public Groups (This Month)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
            leaderboardAsync.when(
              data: (entries) => LeaderboardWidget(entries: entries),
              loading: () => const LeaderboardWidget(entries: [], isLoading: true),
              error: (err, stack) => Center(child: Text('Error: $err')),
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Divider(height: 32),
            ),

            // Growth Actions Section
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                'Grow Your Impact',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            GrowthActionCard(
              title: 'Share Your Progress',
              description: 'Show off your savings milestones to your network.',
              icon: Icons.share_outlined,
              iconColor: Colors.blue,
              actionLabel: 'Share',
              onTap: () {
                // Simulating share via Clipboard for MVP without share_plus
                // In real app, we'd use Share.share(...)
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Share text copied to clipboard! (Simulated)')),
                );
              },
            ),
            GrowthActionCard(
              title: 'Invite a Friend',
              description: 'Bring friends to join the savings movement.',
              icon: Icons.person_add_outlined,
              iconColor: Colors.green,
              actionLabel: 'Invite',
              onTap: () async {
                // This would normally share a deep link.
                // We'll simulate by copying a dummy link.
                await Clipboard.setData(const ClipboardData(text: 'Join me on Ibimina! https://ibimina.app/join/CODE123'));
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Invite link copied to clipboard!')),
                  );
                }
              },
            ),
            GrowthActionCard(
              title: 'Join WhatsApp Channel',
              description: 'Get updates and tips directly on WhatsApp.',
              icon: Icons.chat_bubble_outline,
              iconColor: Colors.teal,
              actionLabel: 'Join',
              onTap: () {
                GrowthService().launchWhatsAppChannel();
              },
            ),
             GrowthActionCard(
              title: 'Become a Sector Ambassador',
              description: 'Lead savings groups in your sector.',
              icon: Icons.badge_outlined,
              iconColor: Colors.purple,
              actionLabel: 'Apply',
              onTap: () {
                GrowthService().launchAmbassadorForm();
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
    );
  }
}

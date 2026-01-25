import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/services/invite_service.dart';
import 'package:ibimina_mobile/features/groups/screens/group_admin_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/show_qr_screen.dart';
import 'package:ibimina_mobile/ui/ui.dart';

class GroupDashboardScreen extends ConsumerWidget {
  const GroupDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupAsync = ref.watch(currentGroupProvider);

    return groupAsync.when(
      data: (group) {
        if (group == null) {
          // Fallback, router should normally redirect to NoGroupScreen
          return const AppScaffold(
            appBar: null,
            body: EmptyState(
              icon: Icons.group_off_rounded,
              title: 'No Group',
              message: 'No active group found.',
            ),
          );
        }

        return AppScaffold(
          appBar: AppBar(
            title: Text(group.name),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings_outlined),
                onPressed: () {
                   Navigator.of(context).push(
                     MaterialPageRoute(builder: (_) => GroupAdminScreen(groupId: group.id)),
                   );
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              ref.refresh(myMembershipProvider);
              ref.refresh(groupMembersProvider(group.id));
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                // Group Info Header
                _buildGroupHeader(context, group),
                const SizedBox(height: AppSpacing.lg),
                
                // Active Members Section
                const SectionHeader(title: 'Members'),
                const SizedBox(height: AppSpacing.md),
                _buildMembersList(ref, group.id),
              ],
            ),
          ),
        );
      },
      loading: () => const AppScaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, stack) => AppScaffold(
        body: Center(child: Text('Error: $err', style: AppTypography.bodyMedium)),
      ),
    );
  }

  Widget _buildGroupHeader(BuildContext context, dynamic group) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
           BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Chip(
                label: Text(group.type.name.toUpperCase(), style: AppTypography.labelSmall),
                backgroundColor: AppColors.surface,
                side: BorderSide.none,
              ),
              if (group.status == 'PENDING_APPROVAL')
                 const StatusPill(label: 'Pending', color: AppColors.warning),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(group.name, style: AppTypography.headlineMedium),
          if (group.description != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(group.description!, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          ],
          const SizedBox(height: AppSpacing.lg),
          const Divider(height: 1),
          const SizedBox(height: AppSpacing.md),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                   Text('Contribution', style: AppTypography.labelSmall),
                   const SizedBox(height: 2),
                   Text('${group.contributionAmount} RWF', style: AppTypography.titleMedium.copyWith(color: AppColors.primary)),
                   Text(group.frequency, style: AppTypography.labelSmall),
                 ],
              ),
              
              // Invite Actions
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.share_outlined, color: AppColors.primary),
                    tooltip: 'Copy Invite Link',
                    onPressed: () {
                      if (group.inviteCode != null) {
                        final link = InviteService.generateInviteLink(group.inviteCode!);
                        Clipboard.setData(ClipboardData(text: link));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Invite link copied!')),
                        );
                      }
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.qr_code, color: AppColors.primary),
                     tooltip: 'Show QR Code',
                    onPressed: () => _showQROptions(context, group),
                  ),
                ],
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMembersList(WidgetRef ref, String groupId) {
    final membersAsync = ref.watch(groupMembersProvider(groupId));
    
    return membersAsync.when(
      data: (members) {
        if (members.isEmpty) {
          return const EmptyState(message: 'No members yet.', title: 'No Members', icon: Icons.person_off_outlined);
        }
        
        return Column(
          children: members.map((member) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: ListRow(
                leading: CircleAvatar(
                  backgroundColor: AppColors.surface,
                  child: Text(member.role[0], style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
                title: member.fullName ?? 'Unknown User', // Use fullName from map if available
                subtitle: member.role, // Or phone number masked
                trailing: member.status == 'GOOD_STANDING' 
                    ? const Icon(Icons.check_circle, color: AppColors.success, size: 20)
                    : null,
                onTap: () {
                  // View member profile details?
                },
              ),
            );
          }).toList(),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Text('Failed to load members: $e', style: const TextStyle(color: AppColors.error)),
    );
  }

  void _showQROptions(BuildContext context, dynamic group) {
    if (group.inviteCode == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No invite code to generate QR')),
      );
      return;
    }
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ShowQRScreen.invite(token: group.inviteCode!),
      ),
    );
  }
}

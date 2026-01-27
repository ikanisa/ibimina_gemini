import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/ui/ui.dart';

class GroupMembersScreen extends ConsumerWidget {
  final String groupId;

  const GroupMembersScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(groupMembersProvider(groupId));

    return AppScaffold(
      appBar: AppBar(title: const Text('Members')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(groupMembersProvider(groupId)),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeader(title: 'Group Directory'),
              const SizedBox(height: AppSpacing.sm),
              membersAsync.when(
                data: (members) {
                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: members.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, index) => _MemberTile(membership: members[index]),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  final GroupMembership membership;

  const _MemberTile({required this.membership});

  @override
  Widget build(BuildContext context) {
    // In a real app we would get the name/phone from a 'members' relation.
    // GroupRepository.getGroupMembers implementation joined 'members' table.
    // Assume we can access it or fallback.
    // Since GroupMembership model might strictly map to group_members table, 
    // we should check if we can access the joined data from the JSON or updated model.
    // For now, we will display generic info if name is missing from model.
    
    // NOTE: In previous steps we didn't update GroupMembership model to include profile fields.
    // We will display Role + Status + Join Date.

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.outline.withValues(alpha: 0.3)),
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
             width: 40, height: 40,
             decoration: BoxDecoration(
               color: AppColors.primary.withValues(alpha: 0.1),
               shape: BoxShape.circle,
             ),
             child: const Icon(Icons.person, color: AppColors.primary),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Show name if available, otherwise truncated userId
                Text(membership.memberName ?? 'Member ${membership.userId.substring(0,6)}...', style: AppTypography.titleSmall),
                Text(membership.role.toUpperCase(), style: AppTypography.labelSmall.copyWith(color: AppColors.darkTextSecondary)),
              ],
            ),
          ),
          StatusPill(
            label: membership.status, 
            color: membership.status == 'ACTIVE' || membership.status == 'GOOD_STANDING' 
                ? AppColors.success 
                : AppColors.warning
          ),
        ],
      ),
    );
  }
}

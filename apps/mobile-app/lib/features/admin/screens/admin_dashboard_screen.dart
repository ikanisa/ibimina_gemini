import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/services/group_repository.dart';
import 'package:ibimina_mobile/ui/ui.dart';

// Provider to fetch pending groups
final pendingGroupsProvider = FutureProvider.autoDispose<List<Group>>((ref) async {
  final repo = ref.read(groupRepositoryProvider);
  return repo.getPendingGroups();
});

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingGroupsAsync = ref.watch(pendingGroupsProvider);

    return AppScaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(pendingGroupsProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeader(title: 'Pending Group Approvals'),
              const SizedBox(height: AppSpacing.sm),
              pendingGroupsAsync.when(
                data: (groups) {
                  if (groups.isEmpty) {
                    return const EmptyState(
                      icon: Icons.verified_user_outlined,
                      title: 'All Clear',
                      message: 'No groups waiting for approval.',
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: groups.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, index) => _GroupApprovalCard(group: groups[index]),
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

class _GroupApprovalCard extends ConsumerStatefulWidget {
  final Group group;

  const _GroupApprovalCard({required this.group});

  @override
  ConsumerState<_GroupApprovalCard> createState() => _GroupApprovalCardState();
}

class _GroupApprovalCardState extends ConsumerState<_GroupApprovalCard> {
  bool _isProcessing = false;

  Future<void> _approve() async {
    setState(() => _isProcessing = true);
    try {
      final repo = ref.read(groupRepositoryProvider);
      await repo.approveGroup(widget.group.id);
      ref.invalidate(pendingGroupsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group Approved'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _reject() async {
     setState(() => _isProcessing = true);
    try {
      final repo = ref.read(groupRepositoryProvider);
      await repo.rejectGroup(widget.group.id);
      ref.invalidate(pendingGroupsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group Rejected'), backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  widget.group.name,
                  style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
              StatusPill(label: widget.group.type.name.toUpperCase(), color: AppColors.info),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          if (widget.group.description != null)
            Text(
              widget.group.description!,
              style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              // Info badges
              _buildInfoBadge(Icons.people, 'Institution: ${widget.group.institutionId.substring(0,6)}...'),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Reject',
                  color: AppColors.error,
                  isLoading: _isProcessing,
                  onPressed: _isProcessing ? null : _reject,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: PrimaryButton(
                  label: 'Approve',
                  isLoading: _isProcessing,
                  onPressed: _isProcessing ? null : _approve,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBadge(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(text, style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary)),
      ],
    );
  }
}

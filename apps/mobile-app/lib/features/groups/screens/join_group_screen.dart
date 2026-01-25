import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/ui/ui.dart';

class JoinGroupScreen extends ConsumerStatefulWidget {
  final String? initialCode;
  const JoinGroupScreen({super.key, this.initialCode});

  @override
  ConsumerState<JoinGroupScreen> createState() => _JoinGroupScreenState();
}

class _JoinGroupScreenState extends ConsumerState<JoinGroupScreen> {
  late final TextEditingController _inviteCodeController;
  final _searchController = TextEditingController();
  
  // Debounce logic can be handled via simple state or robust utils
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _inviteCodeController = TextEditingController(text: widget.initialCode);
    
    // Check membership on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final membership = ref.read(myMembershipProvider).asData?.value;
      if (membership != null && membership.isActive) {
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You are already in a group.')));
           context.go('/group/view');
        }
      }
    });
  }

  @override
  void dispose() {
    _inviteCodeController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _joinWithCode(String code) async {
    final cleanCode = code.trim();
    if (cleanCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an invite code')),
      );
      return;
    }

    try {
      await ref.read(groupControllerProvider.notifier).joinGroup(cleanCode);
      if (mounted) context.go('/group/view');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to join: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchResults = ref.watch(searchGroupsProvider(_searchQuery));
    final controllerState = ref.watch(groupControllerProvider);
    final isLoading = controllerState.isLoading;

    return AppScaffold(
      appBar: AppBar(title: const Text('Join a Group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SectionHeader(title: 'Have an invite code?'),
            const SizedBox(height: AppSpacing.md),
            
            AppTextField(
              controller: _inviteCodeController,
              label: 'Invite Code',
              hint: 'e.g., A7X29B',
              enabled: !isLoading,
              suffixIcon: isLoading 
                  ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2)) 
                  : IconButton(
                    icon: const Icon(Icons.arrow_forward_rounded, color: AppColors.primary),
                    onPressed: () => _joinWithCode(_inviteCodeController.text),
                  ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            const Divider(height: 1),
            const SizedBox(height: AppSpacing.xl),
            
            const SectionHeader(title: 'Find a public group'),
            const SizedBox(height: AppSpacing.md),
            
            AppTextField(
              controller: _searchController,
              label: 'Search Public Groups',
              hint: 'Search by name...',
              suffixIcon: const Icon(Icons.search_rounded),
              onChanged: (val) {
                setState(() => _searchQuery = val);
              },
            ),

            const SizedBox(height: AppSpacing.lg),

            searchResults.when(
              data: (groups) {
                if (groups.isEmpty) {
                  return EmptyState(
                      title: 'No Groups Found',
                      message: _searchQuery.isEmpty 
                          ? 'Start typing to search groups.' 
                          : 'No public groups found matching "$_searchQuery".',
                      icon: Icons.search_off_rounded,
                  );
                }
                
                return Column(
                  children: groups.map((group) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: InfoCard(
                        title: group.name,
                        subtitle: '${group.description ?? "Regular savings group"}\n'
                               'Members: ? • Min: ${group.contributionAmount} RWF', 
                        leading: const Icon(Icons.groups_2_outlined),
                        trailing: TextButton(
                             onPressed: isLoading ? null : () async {
                               if (group.inviteCode != null) {
                                  await _joinWithCode(group.inviteCode!);
                               } else {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No invite code available for this group.')));
                               }
                             },
                             child: const Text('JOIN'),
                           ),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, s) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
            ),
          ],
        ),
      ),
    );
  }
}

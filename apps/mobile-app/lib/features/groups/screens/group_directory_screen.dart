import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/ui/components/app_scaffold.dart';
import 'package:ibimina_mobile/ui/components/app_text_field.dart';
import 'package:ibimina_mobile/ui/components/info_card.dart';

class GroupDirectoryScreen extends ConsumerStatefulWidget {
  const GroupDirectoryScreen({super.key});

  @override
  ConsumerState<GroupDirectoryScreen> createState() =>
      _GroupDirectoryScreenState();
}

class _GroupDirectoryScreenState extends ConsumerState<GroupDirectoryScreen> {
  final _searchController = TextEditingController();
  List<Group> _groups = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _searchGroups('');
  }

  Future<void> _searchGroups(String query) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final repo = ref.read(groupRepositoryProvider);
      final groups = await repo.searchPublicGroups(query);
      setState(() => _groups = groups);
    } catch (e) {
      setState(() => _error = 'Failed to load groups');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _joinGroup(Group group) async {
    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Join ${group.name}?'),
        content: const Text(
          'You can only belong to one group. Joining this group will require admin approval if restricted, or be instant.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Join'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    // TODO: Implement join public group logic (Backend RPC needed for public join without invite code?)
    // Current backend `joinGroup` requires Invite Code.
    // Public groups might have a standard code or specific endpoint.
    // Assuming we use the group's invite code for now if available, or need new endpoint.
    // Since `group_model` exposes `inviteCode`, and we just fetched it...
    // If inviteCode is private, we shouldn't have exposed it?
    // Public groups: invite code is technically public.
    
    if (group.inviteCode == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error: No invite code available for this group')),
      );
      return;
    }

    try {
      final repo = ref.read(groupRepositoryProvider);
      await repo.joinGroup(group.inviteCode!);
      // Refresh membership
      ref.refresh(myMembershipProvider);
      // Main scaffold should handle navigation
      Navigator.of(context).pop(); 
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to join: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Public Groups')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: AppTextField(
              label: '',
              hint: 'Search by name...',
              controller: _searchController,
              onChanged: (val) {
                // Debounce could be added here
                _searchGroups(val);
              },
              suffixIcon: const Icon(Icons.search),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _groups.isEmpty
                        ? const Center(child: Text('No groups found'))
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _groups.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final group = _groups[index];
                              return InfoCard(
                                title: group.name,
                                subtitle: group.description ?? 'No description',
                                leading: const CircleAvatar(
                                  backgroundColor: AppColors.primary,
                                  child: Icon(Icons.group, color: Colors.white),
                                ),
                                onTap: () => _joinGroup(group),
                                trailing: const Icon(Icons.chevron_right),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

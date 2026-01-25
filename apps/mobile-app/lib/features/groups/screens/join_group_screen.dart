import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';

class JoinGroupScreen extends ConsumerStatefulWidget {
  final String? initialCode;
  const JoinGroupScreen({super.key, this.initialCode});

  @override
  ConsumerState<JoinGroupScreen> createState() => _JoinGroupScreenState();
}

class _JoinGroupScreenState extends ConsumerState<JoinGroupScreen> {
  late final TextEditingController _inviteCodeController;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _inviteCodeController = TextEditingController(text: widget.initialCode);
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

  Future<void> _joinWithCode() async {
    final code = _inviteCodeController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an invite code')),
      );
      return;
    }

    try {
      await ref.read(groupControllerProvider.notifier).joinGroup(code);
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

    return Scaffold(
      appBar: AppBar(title: const Text('Join a Group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Have an invite code?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _inviteCodeController,
              decoration: InputDecoration(
                labelText: 'Enter Invite Code',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: controllerState.isLoading ? null : _joinWithCode,
                ),
              ),
            ),
            if (controllerState.isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 8.0),
                child: LinearProgressIndicator(),
              ),
            const Divider(height: 40),
            const Text(
              'Or search for a public group',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Search Groups',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (val) {
                // Debounce could be added here
                setState(() => _searchQuery = val);
              },
            ),
            const SizedBox(height: 10),
            searchResults.when(
              data: (groups) {
                if (groups.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Center(child: Text('No groups found.')),
                  );
                }
                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: groups.length,
                  itemBuilder: (context, index) {
                    final group = groups[index];
                    return ListTile(
                      title: Text(group.name),
                      subtitle: Text('${group.description ?? "No description"}\nMembers: ?'),
                      isThreeLine: true,
                      trailing: ElevatedButton(
                        child: const Text('Join'),
                        onPressed: () async {
                           // For public groups, we might auto-join or request. 
                           // Repository joinGroup currently uses inviteCode.
                           // Need to check if we can join by ID or if public groups imply we can just "Join".
                           // For now, assuming maybe invite code is hidden but required or we need another method.
                           // Actually repo only has joinGroup(inviteCode).
                           // If public group has an invite code, we use that.
                           if (group.inviteCode != null) {
                             try {
                               await ref.read(groupControllerProvider.notifier).joinGroup(group.inviteCode!);
                               if (mounted) context.go('/group/view');
                             } catch (e) {
                               if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                             }
                           } else {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cannot join this group (No code).')));
                           }
                        },
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, s) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }
}

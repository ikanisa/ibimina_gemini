import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/providers/group_providers.dart';
import 'package:ibimina_mobile/features/invites/providers/invite_providers.dart';
import 'package:ibimina_mobile/features/invites/widgets/invite_qr_widget.dart';

class GroupAdminScreen extends ConsumerWidget {
  final String groupId;
  const GroupAdminScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(groupMembersProvider(groupId));


    return Scaffold(

      appBar: AppBar(
        title: const Text('Group Administration'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code),
            tooltip: 'Invite Member',
            onPressed: () => _showInviteDialog(context, groupId, ref),
          ),
        ],
      ),
      body: ListView(
        children: [
          // Pending Requests Section (Future Implementation)
          // const ListTile(title: Text('Pending Requests (0)')),
          // const Divider(),
          
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Member Management', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          membersAsync.when(
            data: (members) {
              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  return ListTile(
                    title: Text(member.memberName ?? member.userId),
                    subtitle: Text('${member.role} • ${member.memberPhone ?? ""}'),
                    trailing: PopupMenuButton(
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'kick', child: Text('Remove Member')),
                        if (member.role == 'MEMBER')
                          const PopupMenuItem(value: 'promote', child: Text('Promote to Admin')),
                      ],
                      onSelected: (value) {
                         // TODO: Implement kick/promote logic in repo
                         ScaffoldMessenger.of(context).showSnackBar(
                           SnackBar(content: Text('Action $value not yet implemented')),
                         );
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
    );
  }

  Future<void> _showInviteDialog(BuildContext context, String groupId, WidgetRef ref) async {
    // Show loading or generate
    showDialog(
      context: context,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final service = ref.read(inviteServiceProvider);
      final inviteUrl = await service.createInvite(groupId);
      
      if (context.mounted) {
        Navigator.pop(context); // Close loading
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Invite Member'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                InviteQRCodeWidget(inviteUrl: inviteUrl),
                const SizedBox(height: 16),
                const Text('Scan this code to join the group.'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close loading
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create invite: $e')),
        );
      }
    }
  }
}

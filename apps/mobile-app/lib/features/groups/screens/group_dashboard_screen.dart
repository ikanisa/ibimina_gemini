import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/services/invite_service.dart';
import 'package:ibimina_mobile/features/groups/screens/group_admin_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/show_qr_screen.dart';

class GroupDashboardScreen extends ConsumerWidget {
  const GroupDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupAsync = ref.watch(currentGroupProvider);

    return groupAsync.when(
      data: (group) {
        if (group == null) {
          // Should normally redirect to NoGroupScreen, but if we are here:
          return const Center(child: Text('No active group found.'));
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(group.name),
            actions: [
              IconButton(
                icon: const Icon(Icons.share),
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
                icon: const Icon(Icons.qr_code),
                onPressed: () => _showQROptions(context, group),
              ),
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () {
                   Navigator.of(context).push(
                     MaterialPageRoute(
                       builder: (_) => GroupAdminScreen(groupId: group.id),
                     ),
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
              padding: const EdgeInsets.all(16),
              children: [
                _buildGroupInfoCard(group),
                const SizedBox(height: 24),
                const Text(
                  'Members',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                _buildMembersList(ref, group.id),
              ],
            ),
          ),
        );
      },
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, stack) => Scaffold(body: Center(child: Text('Error: $err'))),
    );
  }

  Widget _buildGroupInfoCard(group) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Invite Code: ${group.inviteCode ?? "N/A"}', 
              style: const TextStyle(fontWeight: FontWeight.bold)),
            if (group.description != null) ...[
              const SizedBox(height: 8),
              Text(group.description!),
            ],
            const SizedBox(height: 8),
            Chip(label: Text(group.type.name.toUpperCase())),
          ],
        ),
      ),
    );
  }

  Widget _buildMembersList(WidgetRef ref, String groupId) {
    final membersAsync = ref.watch(groupMembersProvider(groupId));
    
    return membersAsync.when(
      data: (members) {
        if (members.isEmpty) return const Text('No members yet.');
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: members.length,
          itemBuilder: (context, index) {
            final member = members[index];
            return ListTile(
              leading: CircleAvatar(child: Text(member.role[0])),
              title: Text(member.userId), // Should be name, need to update Model
              subtitle: Text(member.role),
              trailing: member.status == 'GOOD_STANDING' 
                  ? const Icon(Icons.check_circle, color: Colors.green, size: 16)
                  : null,
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Text('Failed to load members: $e'),
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

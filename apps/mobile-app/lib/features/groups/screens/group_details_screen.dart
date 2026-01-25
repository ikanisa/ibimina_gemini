import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';

class GroupDetailsScreen extends ConsumerWidget {
  const GroupDetailsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membershipAsync = ref.watch(myMembershipProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Group')),
      body: membershipAsync.when(
        data: (membership) {
          if (membership == null) return const Center(child: Text('You are not in a group'));
          final group = membership.group;
          if (group == null) return const Center(child: Text('Group data missing'));
          
          final membersAsync = ref.watch(groupMembersProvider(group.id));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (group.status == 'PENDING_APPROVAL')
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(8),
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.orange.shade200),
                            ),
                            child: const Text(
                              'Group is pending approval. Features limited.',
                              style: TextStyle(color: Colors.orange),
                            ),
                          ),
                        Text(group.name, style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 8),
                         if (group.inviteCode != null && group.status == 'APPROVED')
                           SelectableText('Invite Code: ${group.inviteCode}', style: const TextStyle(fontWeight: FontWeight.bold)),
                         const SizedBox(height: 8),
                        Text('Role: ${membership.role}'),
                        Text('Contribution: ${group.contributionAmount} RWF / ${group.frequency}'),
                        Text('Description: ${group.description ?? "N/A"}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Members', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                membersAsync.when(
                  data: (members) {
                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: members.length,
                      separatorBuilder: (context, index) => const Divider(),
                      itemBuilder: (context, index) {
                        final m = members[index];
                        // If model updated to include member name/phone
                        return ListTile(
                          leading: CircleAvatar(child: Text(m.memberName?[0] ?? '?')),
                          title: Text(m.memberName ?? 'Unknown'),
                          subtitle: Text(m.role),
                          trailing: Text(m.status),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, s) => Text('Error loading members: $e'),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

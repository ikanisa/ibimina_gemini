import 'package:flutter/material.dart';
import 'package:ibimina_mobile/features/groups/screens/create_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/join_group_screen.dart';

class NoGroupScreen extends StatelessWidget {
  const NoGroupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Group Required')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.group_off_rounded, size: 80, color: Colors.grey),
            const SizedBox(height: 24),
            const Text(
              'Join or Create a Group',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'To start saving and contributing, you need to belong to a group.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const CreateGroupScreen()),
                );
              },
              child: const Text('Create New Group'),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const JoinGroupScreen()),
                );
              },
              child: const Text('Join Existing Group'),
            ),
          ],
        ),
      ),
    );
  }
}

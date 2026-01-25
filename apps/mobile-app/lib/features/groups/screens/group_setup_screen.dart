import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/screens/create_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_directory_screen.dart';
import 'package:ibimina_mobile/ui/components/app_scaffold.dart';
import 'package:ibimina_mobile/ui/components/app_text_field.dart';
import 'package:ibimina_mobile/ui/components/buttons.dart';

/// Group setup screen - Hub for joining or creating a group.
class GroupSetupScreen extends ConsumerStatefulWidget {
  const GroupSetupScreen({super.key});

  @override
  ConsumerState<GroupSetupScreen> createState() => _GroupSetupScreenState();
}

class _GroupSetupScreenState extends ConsumerState<GroupSetupScreen> {
  final _inviteCodeController = TextEditingController();
  bool _isJoining = false;

  @override
  void dispose() {
    _inviteCodeController.dispose();
    super.dispose();
  }

  Future<void> _joinWithCode() async {
    final code = _inviteCodeController.text.trim().toUpperCase();
    if (code.isEmpty) return;

    if (code.length < 6) {
       ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid code length')),
      );
      return;
    }

    setState(() => _isJoining = true);
    try {
      final repo = ref.read(groupRepositoryProvider);
      await repo.joinGroup(code);
      
      // Refresh membership
      ref.refresh(myMembershipProvider);
      // Navigation handled by wrapper usually, but here we might need manual push
      if (mounted) {
         Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        String msg = e.toString();
        if (msg.contains('already_member')) msg = 'You are already in this group';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $msg')),
        );
      }
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  void _goToCreate() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreateGroupScreen()),
    );
  }

  void _goToDirectory() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const GroupDirectoryScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Group Setup')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Join the Community',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'To start saving, you need to be part of a group.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.darkTextSecondary,
                  ),
            ),
            const SizedBox(height: 32),

            // Option 1: Invite Code
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.password, color: AppColors.primary),
                      const SizedBox(width: 12),
                      Text(
                        'Have an invite code?',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Invite Code',
                    hint: 'e.g. A1B2C3',
                    controller: _inviteCodeController,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: PrimaryButton(
                      label: 'Join with Code',
                      isLoading: _isJoining,
                      onPressed: _joinWithCode,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Row(
              children: [
                Expanded(child: Divider(color: AppColors.darkBorder)),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('OR', style: TextStyle(color: AppColors.darkTextSecondary)),
                ),
                Expanded(child: Divider(color: AppColors.darkBorder)),
              ],
            ),
            const SizedBox(height: 24),

            // Option 2: Public Directory
            OutlinedButton.icon(
              onPressed: _goToDirectory,
              icon: const Icon(Icons.search),
              label: const Text('Browse Public Groups'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                alignment: Alignment.centerLeft,
              ),
            ),
            
            const SizedBox(height: 16),

            // Option 3: Create
            OutlinedButton.icon(
              onPressed: _goToCreate,
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Create New Group'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                alignment: Alignment.centerLeft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/services/group_repository.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';

// Provider for GroupRepository (assuming one exists or defined here for simplicity of this screen)
final groupRepositoryProvider = Provider((ref) => GroupRepository());

// FutureProvider to fetch the group preview
final groupPreviewProvider = FutureProvider.family<Group, String>((ref, token) async {
  final repository = ref.read(groupRepositoryProvider);
  return repository.fetchGroupPreview(token);
});

class JoinConfirmationScreen extends ConsumerStatefulWidget {
  final String token;

  const JoinConfirmationScreen({super.key, required this.token});

  @override
  ConsumerState<JoinConfirmationScreen> createState() => _JoinConfirmationScreenState();
}

class _JoinConfirmationScreenState extends ConsumerState<JoinConfirmationScreen> {
  bool isJoining = false;
  String? errorMessage;

  Future<void> _handleJoin() async {
    setState(() {
      isJoining = true;
      errorMessage = null;
    });

    try {
      final repository = ref.read(groupRepositoryProvider);
      await repository.joinGroup(widget.token);
      
      if (mounted) {
        // Navigate to Home or specific route on success
        // Use go() to clear stack or pushReplacement
        context.go('/'); 
        ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('Successfully joined the group!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          errorMessage = e.toString().replaceAll('Exception: ', '');
          isJoining = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(groupPreviewProvider(widget.token));

    return Scaffold(
      appBar: AppBar(title: const Text('Join Group')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: groupAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.amber),
                const SizedBox(height: 16),
                Text(
                  'Unable to find group',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  err.toString().replaceAll('Exception: ', ''),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  child: const Text('Back'),
                ),
              ],
            ),
          ),
          data: (group) => Center(
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.group_add, size: 64, color: AppColors.primary),
                    const SizedBox(height: 16),
                    Text(
                      'Join this group?',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      group.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (group.description != null && group.description!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        group.description!,
                        style: const TextStyle(color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Chip(label: Text(group.type.name.toUpperCase())),
                    
                    const SizedBox(height: 32),
                    
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.info_outline, color: Colors.orange),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'You can only identify with ONE group at a time. Joining this group will require admin approval if public.',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                    
                    if (errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: Text(
                          errorMessage!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isJoining ? null : _handleJoin,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: isJoining 
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Confirm & Join'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: isJoining ? null : () => context.pop(),
                      child: const Text('Cancel'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

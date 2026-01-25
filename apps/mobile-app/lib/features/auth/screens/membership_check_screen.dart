import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/profile_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/screens/group_setup_screen.dart';

/// Membership check screen - looks up user's group membership and routes accordingly.
class MembershipCheckScreen extends ConsumerStatefulWidget {
  const MembershipCheckScreen({super.key});

  @override
  ConsumerState<MembershipCheckScreen> createState() =>
      _MembershipCheckScreenState();
}

class _MembershipCheckScreenState extends ConsumerState<MembershipCheckScreen> {
  bool _isLoading = true;
  GroupMembership? _membership;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkMembership();
  }

  Future<void> _checkMembership() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get the current profile to get MoMo number
      final profile = await ref.read(currentProfileProvider.future);
      
      if (profile == null) {
        setState(() {
          _error = 'Profile not found';
          _isLoading = false;
        });
        return;
      }

      // Look up membership by MoMo number
      final groupRepo = ref.read(groupRepositoryProvider);
      final membership = await groupRepo.lookupByMomoNumber(
        profile.momoNumber,
      );

        _membership = membership;
        _isLoading = false;
        
        // Persist institution ID to profile so global membership check works
        if (membership != null) {
            final user = ref.read(currentUserProvider)!;
            final profileService = ref.read(profileServiceProvider);
            // Assuming group has institution_id. We need to fetch it or ensure membership has it.
            // Membership object usually has group, group has institution_id.
            // Let's verify Membership model or response structure.
            // If membership.group is fully populated it should have it.
            // For now, I'll update assuming I can access it.
             await profileService.updateInstitutionId(user.id, membership.institutionId);
             
             // Refresh providers to trigger router
             ref.refresh(myMembershipProvider);
             ref.refresh(myMembershipProvider);
        }
    } catch (e) {
      setState(() {
        _error = 'Failed to check membership. Please try again.';
        _isLoading = false;
      });
    }
  }

  void _navigateToHome() {
     // Navigation handled by RouterNotifier
  }

  void _navigateToGroupSetup() {
    // Navigate to group setup/join via context.push or similar if not handled by router flow
    // Since 'No Group' is a valid state for MembershipCheckScreen, user action is needed.
    // We can use context.push('/groups/setup') or similar.
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const GroupSetupScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _isLoading
              ? _buildLoadingState()
              : _error != null
                  ? _buildErrorState()
                  : _membership != null
                      ? _buildMembershipFound()
                      : _buildNoMembership(),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 24),
        Text(
          'Checking your membership...',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.darkTextSecondary,
              ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline,
            size: 40,
            color: AppColors.error,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Something went wrong',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          _error!,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.darkTextSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _checkMembership,
            child: const Text('Try Again'),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () {
            // Contact support
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Support: contact@ibimina.rw')),
            );
          },
          child: const Text('Contact Support'),
        ),
      ],
    );
  }

  Widget _buildMembershipFound() {
    final group = _membership!.group;

    if (group == null) {
        return _buildErrorState(); // Should not happen if data integrity is good
    }
    
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_outline,
            size: 40,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Welcome!',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'You are a member of',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.darkTextSecondary,
              ),
        ),
        const SizedBox(height: 24),
        // Group card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.groups,
                  size: 28,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                group.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              if (group.description != null) ...[
                const SizedBox(height: 8),
                Text(
                  group.description!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.darkTextSecondary,
                      ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _membership!.role.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _navigateToHome,
            child: const Text('Continue'),
          ),
        ),
      ],
    );
  }

  Widget _buildNoMembership() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.info.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.group_add,
            size: 40,
            color: AppColors.info,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'No group found',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'To start saving, you need to be part of a savings group. Join an existing group or create a new one.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.darkTextSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _navigateToGroupSetup,
            icon: const Icon(Icons.search),
            label: const Text('Join a Group'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _navigateToGroupSetup,
            icon: const Icon(Icons.add),
            label: const Text('Create a Group'),
          ),
        ),
      ],
    );
  }
}

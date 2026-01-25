import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/profile_providers.dart';
import 'package:ibimina_mobile/features/auth/screens/welcome_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/create_passcode_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/profile_completion_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/membership_check_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/app_lock_screen.dart';
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/invites/providers/invite_providers.dart';
import 'package:ibimina_mobile/features/groups/screens/join_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/pending_approval_screen.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';

/// Auth wrapper that handles the complete onboarding flow:
/// 1. Not authenticated → WelcomeScreen
/// 2. Authenticated, no passcode → CreatePasscodeScreen
/// 3. Authenticated, has passcode, no profile → ProfileCompletionScreen
/// 4. Profile complete, no membership → MembershipCheckScreen
/// 5. Has membership → Home (with AppLock gate)
class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuthenticated = ref.watch(isAuthenticatedProvider);

    // Listen for deep links
    ref.listen(inviteTokenStreamProvider, (previous, next) {
      next.whenData((token) async {
        if (token.isEmpty) return;
        
        // If not authenticated, we ignore deep links for now (per plan)
        // or we could store it in a provider to use after login.
        if (!ref.read(isAuthenticatedProvider)) return;

        // Check membership
        final membership = await ref.read(myMembershipProvider.future);
        if (!context.mounted) return;

        if (membership != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You are already in a group')),
          );
          return;
        }

        // Navigate to Join Group with code
        if (context.mounted) {
           Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => JoinGroupScreen(initialCode: token),
            ),
          );
        }
      });
    });

    // Step 1: Not authenticated
    if (!isAuthenticated) {
      return const WelcomeScreen();
    }

    // User is authenticated, check onboarding status
    return _AuthenticatedFlow();
  }
}

class _AuthenticatedFlow extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Step 2: Check if passcode exists
    final hasPasscode = ref.watch(hasPasscodeProvider);

    return hasPasscode.when(
      data: (hasPasscode) {
        if (!hasPasscode) {
          return const CreatePasscodeScreen();
        }
        // Has passcode, check profile
        // Has passcode, require unlock to proceed
        return const AppLockScreen(child: _ProfileCheck());
      },
      loading: () => const _LoadingScreen(),
      error: (_, __) => const CreatePasscodeScreen(),
    );
  }
}

class _ProfileCheck extends ConsumerWidget {
  const _ProfileCheck();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Step 3: Check if profile is complete
    final isProfileComplete = ref.watch(isProfileCompleteProvider);

    return isProfileComplete.when(
      data: (isComplete) {
        if (!isComplete) {
          return const ProfileCompletionScreen();
        }
        // Profile complete, check membership
        return const _MembershipCheck();
      },
      loading: () => const _LoadingScreen(),
      error: (_, __) => const ProfileCompletionScreen(),
    );
  }
}

class _MembershipCheck extends ConsumerWidget {
  const _MembershipCheck();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Step 4: Check if user has membership
    final membershipAsync = ref.watch(myMembershipProvider);

    return membershipAsync.when(
      data: (membership) {
        if (membership == null) {
          // First time after profile - show membership check screen
          return const MembershipCheckScreen();
        }
        // Has membership, check status
        // Assuming status field is 'status' (e.g. 'ACTIVE', 'PENDING')
        if (membership.status == 'PENDING_APPROVAL' || membership.status == 'PENDING') {
           return const PendingApprovalScreen();
        }

        // Active membership, show home
        // Note: AppLockScreen is applied at _AuthenticatedFlow level
        return const DashboardScreen();
      },
      loading: () => const _LoadingScreen(),
      error: (_, __) => const MembershipCheckScreen(),
    );
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

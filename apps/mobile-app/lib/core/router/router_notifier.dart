import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/profile_providers.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    // Listen to all dependencies that should trigger a redirect check
    _ref.listen(authStateProvider, (_, __) => notifyListeners());
    _ref.listen(hasPasscodeProvider, (_, __) => notifyListeners());
    _ref.listen(isProfileCompleteProvider, (_, __) => notifyListeners());
    _ref.listen(myMembershipProvider, (_, __) => notifyListeners());
  }

  /// Redirect logic for GoRouter
  String? redirect(BuildContext context, GoRouterState state) {
    // Check loading states if needed, but usually we just redirect based on current values
    // If critical auth state is loading, we might want to return null (stay put) or splash?
    // But ref.read(provider).isLoading might be true.
    // Ideally we wait for AuthState to be ready.
    
    final authState = _ref.read(authStateProvider);
    if (authState.isLoading) return null; // Or splash?

    final isAuth = authState.asData?.value.session != null;
    final isLoggingIn = state.uri.toString().startsWith('/auth') || state.uri.toString() == '/welcome';
    
    // 1. Not authenticated
    if (!isAuth) {
      return isLoggingIn ? null : '/welcome';
    }

    // 2. Authenticated - Check Passcode
    final hasPasscodeAsync = _ref.read(hasPasscodeProvider);
    if (hasPasscodeAsync.isLoading) return null;
    
    final hasPasscode = hasPasscodeAsync.asData?.value ?? false;
    if (!hasPasscode) {
       if (state.uri.toString() == '/auth/passcode/create') return null;
       return '/auth/passcode/create';
    }
    
    // 3. Authenticated - Check Profile
    final isProfileCompleteAsync = _ref.read(isProfileCompleteProvider);
    if (isProfileCompleteAsync.isLoading) return null;
    
    final isProfileComplete = isProfileCompleteAsync.asData?.value ?? false;
    if (!isProfileComplete) {
      if (state.uri.toString() == '/profile/complete') return null;
      return '/profile/complete';
    }

    // 4. Authenticated - Check Membership
    final membershipAsync = _ref.read(myMembershipProvider);
    if (membershipAsync.isLoading) return null;
    
    final membership = membershipAsync.asData?.value;
    final hasMembership = membership != null;
    if (!hasMembership) { 
        if (state.uri.toString() == '/membership/check') return null;
        return '/membership/check'; 
    }

    // 5. Everything good -> Home
    if (isLoggingIn || state.uri.toString() == '/') {
      return '/home';
    }

    return null;
  }
}

final routerNotifierProvider = Provider.autoDispose<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

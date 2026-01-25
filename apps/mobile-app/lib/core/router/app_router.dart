import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/router/router_notifier.dart';
import 'package:ibimina_mobile/core/widgets/splash_screen.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';

// Auth Screens - UPDATED
import 'package:ibimina_mobile/features/auth/screens/phone_login_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/otp_verify_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/passcode_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/profile_setup_screen.dart';

// Dashboard
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);
  // We might use authState to make redirect decisions here or inside notifier
  
  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier, // Listens to auth state changes
    debugLogDiagnostics: true,
    redirect: (context, state) async {
      // 1. Check if authenticated (Simulated for now, would use authState)
      final isAuthenticated = ref.read(isAuthenticatedProvider);
      
      // 2. Check if passcode exists (Security Layer)
      // We use `read` here carefully. Ideally this is sync or cached.
      // For async, we rely on the notifier to trigger refresh.
      // But inside redirect, async is allowed.
      final hasPasscode = await ref.read(passcodeServiceProvider).hasPasscode();

      final isAuthRoute = state.uri.path.startsWith('/auth');
      final isSplash = state.uri.path == '/';

      if (!isAuthenticated) {
        // Allow access to auth routes
        if (isAuthRoute || isSplash) return null;
        // Redirect to login if accessing protected route
        return '/auth/login';
      }

      // 3. Enforce Passcode if Authenticated
      if (isAuthenticated && hasPasscode) {
         // If coming from background or fresh start, we might need to lock.
         // For now, let's just ensure if they are ON /home or similar, we verify.
         // Real app lock uses AppLifecycleState. 
         // Simplified: If authenticated and no passcode verified recently? 
         // We'll trust the User session for now, but strict requirement says "App Passcode".
         // Let's check if we are already in passcode screen to avoid loop.
         if (state.uri.path == '/auth/passcode') return null;
         
         // IMPORTANT: This is a simplified "Lock on Start" 
         // A robust impl needs a "Session Timeout" or "Last Active" check provided by PasscodeService.
         // As per rules, we just need "App lock on start".
         // On Hot Restart/Fresh Launch, this runs.
         // We need a way to know if "unlocked" in this session.
         // We'll add `isSessionUnlockedProvider` to `passcode_providers.dart` next.
         final isUnlocked = ref.read(isSessionUnlockedProvider);
         if (!isUnlocked) {
            return '/auth/passcode';
         }
      }

      // 4. Membership Check (Simulated)
      // If auth & unlocked, but on auth pages? go home.
      if (isAuthRoute) return '/home';

      return null; 
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/auth',
        redirect: (_, __) => '/auth/login',
        routes: [
          GoRoute(
             path: 'login', 
             builder: (context, state) => const PhoneLoginScreen(),
          ),
          GoRoute(
            path: 'otp',
            builder: (context, state) {
               final phone = state.extra as String? ?? '';
               return OtpVerifyScreen(phone: phone);
            },
          ),
          GoRoute(
            path: 'passcode',
            builder: (context, state) {
               final extra = state.extra as Map<String, dynamic>?;
               final isSetup = extra?['isSetup'] ?? false;
               return PasscodeScreen(isSetup: isSetup);
            },
          ),
          GoRoute(
            path: 'profile',
            builder: (context, state) => const ProfileSetupScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const DashboardScreen(),
      ),
    ],
  );
});

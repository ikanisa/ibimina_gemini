import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/router/router_notifier.dart';
import 'package:ibimina_mobile/core/widgets/splash_screen.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_provider.dart';

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
    redirect: (context, state) {
      // Basic Auth Guard
      // real logic relies on notifier.authState which should come from Supabase/AuthService
      // For now, let's keep it simple: initial launch -> splash -> checks auth -> redirects.
      
      // If unauth and trying to access protected -> /auth/login
      // This logic likely resides in RouterNotifier, but we can augment here if needed.
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

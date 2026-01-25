import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/router/router_notifier.dart';
import 'package:ibimina_mobile/core/widgets/splash_screen.dart';

// Auth Screens
import 'package:ibimina_mobile/features/auth/screens/welcome_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/auth_method_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/email_auth_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/login_screen.dart'; // Added LoginScreen import
import 'package:ibimina_mobile/features/auth/screens/otp_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/create_passcode_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/app_lock_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/biometrics_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/profile_completion_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/membership_check_screen.dart';

// Group Screens
import 'package:ibimina_mobile/features/groups/screens/pending_approval_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/join_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/create_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_details_screen.dart';

// Dashboard
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';

// Join & Scan Screens
import 'package:ibimina_mobile/features/invites/screens/join_confirmation_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/scan_qr_screen.dart';
import 'package:ibimina_mobile/features/support/screens/fix_rejected_submission_screen.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/auth',
        redirect: (_, __) => '/auth/method',
        routes: [
          GoRoute(
             path: 'method', // /auth/method
             builder: (context, state) => const AuthMethodScreen(),
          ),
          GoRoute(
            path: 'email', // /auth/email?mode=login|signup
            builder: (context, state) {
              final mode = state.uri.queryParameters['mode'] ?? 'login';
              return EmailAuthScreen(initialMode: mode);
            },
          ),
          GoRoute(
             path: 'login', // /auth/login (Phone input)
             builder: (context, state) => const LoginScreen(),
          ),
          GoRoute(
            path: 'otp', // /auth/otp
            builder: (context, state) {
               final phone = state.uri.queryParameters['phone'];
               if (phone == null) return const AuthMethodScreen(); // Fallback
               return OtpScreen(phone: phone);
            },
          ),
          GoRoute(
            path: 'passcode',
            redirect: (_, __) => '/auth/passcode/create',
            routes: [
              GoRoute(
                path: 'create', // /auth/passcode/create
                builder: (context, state) => const CreatePasscodeScreen(),
              ),
            ],
          ),
          GoRoute(
            path: 'biometrics', // /auth/biometrics
            builder: (context, state) => const BiometricsScreen(),
          ),
        ],
      ),
      // Authenticated & Secured Routes
      ShellRoute(
        builder: (context, state, child) {
           return AppLockScreen(child: child);
        },
        routes: [
          GoRoute(
            path: '/profile/complete',
            builder: (context, state) => const ProfileCompletionScreen(),
          ),
          GoRoute(
            path: '/membership',
            routes: [
              GoRoute(
                path: 'check', // /membership/check
                builder: (context, state) => const MembershipCheckScreen(),
              ),
              GoRoute(
                path: 'pending', // /membership/pending
                builder: (context, state) => const PendingApprovalScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/group',
            routes: [
              GoRoute(
                path: 'view',
                builder: (context, state) => const GroupDetailsScreen(),
              ),
              GoRoute(
                path: 'create',
                builder: (context, state) => const CreateGroupScreen(),
              ),
              GoRoute(
                path: 'join',
                builder: (context, state) => const JoinGroupScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/home',
            builder: (context, state) => const DashboardScreen(),
          ),
          // Deep Link / QR Routes (secured, accessible after auth/pin)
          GoRoute(
            path: '/join',
            builder: (context, state) {
                final token = state.extra as Map<String, dynamic>?; 
                final tokenString = token?['token'] as String?;
                
                if (tokenString == null) {
                   // If reached without token, redirect or show error?
                   // Or maybe manual entry screen?
                   return const JoinGroupScreen(); // Fallback to manual entry
                }
                return JoinConfirmationScreen(token: tokenString);
            },
          ),
          GoRoute(
            path: '/scan',
            builder: (context, state) => const ScanQRScreen(),
          ),
          GoRoute(
            path: '/fix-rejected', // /fix-rejected
            builder: (context, state) {
              final transaction = state.extra as Transaction;
              return FixRejectedSubmissionScreen(transaction: transaction);
            },
          ),
        ],
      ),
    ],
  );
});

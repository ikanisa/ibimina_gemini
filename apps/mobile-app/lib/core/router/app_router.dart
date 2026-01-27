import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/router/router_notifier.dart';
import 'package:ibimina_mobile/core/widgets/splash_screen.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';

// Auth Screens
import 'package:ibimina_mobile/features/auth/screens/phone_login_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/otp_verify_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/passcode_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/profile_setup_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/biometrics_screen.dart';

// Dashboard
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';

// Groups
import 'package:ibimina_mobile/features/groups/screens/no_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/create_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/join_group_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_details_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_members_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_admin_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_dashboard_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/group_directory_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/pending_approval_screen.dart';
import 'package:ibimina_mobile/features/groups/screens/qr_scanner_screen.dart';

// Contribution
import 'package:ibimina_mobile/features/contribution/screens/contribute_screen.dart';
import 'package:ibimina_mobile/features/contribution/screens/proof_upload_screen.dart';

// Settings
import 'package:ibimina_mobile/features/settings/screens/settings_screen.dart';

// Ledger
import 'package:ibimina_mobile/features/ledger/screens/ledger_screen.dart';
import 'package:ibimina_mobile/features/ledger/screens/wallet_screen.dart';

// Invites - use the QR screens from invites folder
import 'package:ibimina_mobile/features/invites/screens/scan_qr_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/show_qr_screen.dart';
import 'package:ibimina_mobile/features/invites/screens/join_confirmation_screen.dart';

// Support
import 'package:ibimina_mobile/features/support/screens/help_center_screen.dart';

// Admin
import 'package:ibimina_mobile/features/admin/screens/admin_dashboard_screen.dart';
import 'package:ibimina_mobile/features/admin/screens/treasurer_dashboard_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);
  
  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    debugLogDiagnostics: true,
    redirect: (context, state) async {
      final isAuthenticated = ref.read(isAuthenticatedProvider);
      
      final isAuthRoute = state.uri.path.startsWith('/auth');
      final isSplash = state.uri.path == '/';
      
      print('[ROUTER] Evaluating redirect for: ${state.uri.path}');
      print('[ROUTER] isAuthenticated: $isAuthenticated');

      // SPLASH SCREEN: Always redirect away from splash
      if (isSplash) {
        if (!isAuthenticated) {
          return '/auth/login';
        }
        final hasPasscode = await ref.read(passcodeServiceProvider).hasPasscode();
        if (hasPasscode) {
          final isUnlocked = ref.read(isSessionUnlockedProvider);
          if (!isUnlocked) {
            return '/auth/passcode';
          }
        }
        return '/home';
      }

      // UNAUTHENTICATED: Allow all auth routes, block protected routes
      if (!isAuthenticated) {
        if (isAuthRoute) {
          return null;
        }
        return '/auth/login';
      }

      // AUTHENTICATED: Handle passcode lock
      final hasPasscode = await ref.read(passcodeServiceProvider).hasPasscode();
      if (hasPasscode && state.uri.path != '/auth/passcode') {
        final isUnlocked = ref.read(isSessionUnlockedProvider);
        if (!isUnlocked) {
          return '/auth/passcode';
        }
      }

      // Authenticated + unlocked: kick away from auth pages (except passcode)
      if (isAuthRoute && state.uri.path != '/auth/passcode') {
        return '/home';
      }

      return null; 
    },

    routes: [
      // ==================== SPLASH ====================
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // ==================== AUTH ROUTES ====================
      GoRoute(
        path: '/auth',
        redirect: (context, state) {
          if (state.uri.path == '/auth') {
            return '/auth/login';
          }
          return null;
        },
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
          GoRoute(
            path: 'biometrics',
            builder: (context, state) => const BiometricsScreen(),
          ),
        ],
      ),
      
      // ==================== HOME / DASHBOARD ====================
      GoRoute(
        path: '/home',
        builder: (context, state) => const DashboardScreen(),
      ),
      
      // ==================== GROUPS ====================
      GoRoute(
        path: '/groups',
        builder: (context, state) => const GroupDirectoryScreen(),
        routes: [
          GoRoute(
            path: 'create',
            builder: (context, state) => const CreateGroupScreen(),
          ),
          GoRoute(
            path: 'join',
            builder: (context, state) {
              final extra = state.extra as Map<String, dynamic>?;
              final initialCode = extra?['initialCode'] as String?;
              return JoinGroupScreen(initialCode: initialCode);
            },
          ),
          GoRoute(
            path: 'pending',
            builder: (context, state) => const PendingApprovalScreen(),
          ),
          GoRoute(
            path: 'no-group',
            builder: (context, state) => const NoGroupScreen(),
          ),
          GoRoute(
            path: 'dashboard',
            builder: (context, state) => const GroupDashboardScreen(),
          ),
          GoRoute(
            path: 'details',
            builder: (context, state) => const GroupDetailsScreen(),
          ),
          GoRoute(
            path: 'members/:groupId',
            builder: (context, state) {
              final groupId = state.pathParameters['groupId'] ?? '';
              return GroupMembersScreen(groupId: groupId);
            },
          ),
          GoRoute(
            path: 'admin/:groupId',
            builder: (context, state) {
              final groupId = state.pathParameters['groupId'] ?? '';
              return GroupAdminScreen(groupId: groupId);
            },
          ),
        ],
      ),
      
      // ==================== CONTRIBUTION ====================
      GoRoute(
        path: '/contribute',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final groupId = extra?['groupId'] as String? ?? '';
          final groupName = extra?['groupName'] as String? ?? '';
          final initialAmount = extra?['initialAmount'] as int?;
          return ContributeScreen(
            groupId: groupId,
            groupName: groupName,
            initialAmount: initialAmount,
          );
        },
        routes: [
          GoRoute(
            path: 'proof',
            builder: (context, state) {
              final extra = state.extra as Map<String, dynamic>?;
              final amount = extra?['amount'] as int? ?? 0;
              final groupId = extra?['groupId'] as String? ?? '';
              final groupName = extra?['groupName'] as String? ?? '';
              return ProofUploadScreen(amount: amount, groupId: groupId, groupName: groupName);
            },
          ),
        ],
      ),
      
      // ==================== SETTINGS ====================
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      
      // ==================== LEDGER / WALLET ====================
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/ledger',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final groupId = extra?['groupId'] as String? ?? '';
          final groupName = extra?['groupName'] as String? ?? '';
          return LedgerScreen(groupId: groupId, groupName: groupName);
        },
      ),
      
      // ==================== SCAN / INVITES ====================
      GoRoute(
        path: '/scan',
        builder: (context, state) => const ScanQRScreen(),
      ),
      GoRoute(
        path: '/scan-group',
        builder: (context, state) => const QRScannerScreen(),
      ),
      GoRoute(
        path: '/invite/show',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final title = extra?['title'] as String? ?? 'Invite QR';
          final description = extra?['description'] as String? ?? '';
          final data = extra?['data'] as String? ?? '';
          return ShowQRScreen(title: title, description: description, data: data);
        },
      ),
      GoRoute(
        path: '/invite/confirm/:token',
        builder: (context, state) {
          final token = state.pathParameters['token'] ?? '';
          return JoinConfirmationScreen(token: token);
        },
      ),
      
      // ==================== SUPPORT / HELP ====================
      GoRoute(
        path: '/help',
        builder: (context, state) => const HelpCenterScreen(),
      ),
      // Note: ArticleDetailScreen requires Article object which can't easily be passed via path
      // Use Navigator.push from HelpCenterScreen instead
      
      // ==================== ADMIN ====================
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
        routes: [
          GoRoute(
            path: 'treasurer/:groupId',
            builder: (context, state) {
              final groupId = state.pathParameters['groupId'] ?? '';
              return TreasurerDashboardScreen(groupId: groupId);
            },
          ),
        ],
      ),
    ],
  );
});

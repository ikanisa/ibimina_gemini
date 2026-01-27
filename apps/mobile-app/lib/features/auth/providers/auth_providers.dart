import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ibimina_mobile/config/app_config.dart';
import 'package:ibimina_mobile/features/auth/services/auth_service.dart';

final authServiceProvider = Provider((ref) => AuthService());

final authStateProvider = StreamProvider<AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

final currentUserProvider = Provider<User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.currentUser;
});

/// DEV MODE: Override to simulate authenticated state for testing
/// Set this to true after successful dev mode OTP verification
final devModeAuthOverrideProvider = NotifierProvider<DevModeAuthOverrideNotifier, bool>(
  DevModeAuthOverrideNotifier.new,
);

class DevModeAuthOverrideNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  
  void setAuthenticated(bool value) {
    state = value;
  }
}

/// Check if user is authenticated
/// In dev mode, respects the devModeAuthOverrideProvider for testing
final isAuthenticatedProvider = Provider<bool>((ref) {
  // DEV MODE: Allow override for testing without real Supabase auth
  if (AppConfig.instance.flavor == AppFlavor.dev) {
    final override = ref.watch(devModeAuthOverrideProvider);
    if (override) return true;
  }
  
  final authService = ref.watch(authServiceProvider);
  return authService.isAuthenticated;
});

final authControllerProvider = AsyncNotifierProvider<AuthController, void>(AuthController.new);

class AuthController extends AsyncNotifier<void> {
  late final AuthService _authService;

  @override
  FutureOr<void> build() {
    _authService = ref.watch(authServiceProvider);
    return null;
  }

  Future<void> sendOtp(String phone) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _authService.sendOtp(phone));
  }

  Future<void> verifyOtp({required String phone, required String otp}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _authService.verifyOtp(phone, otp));
  }
  
  /// Sign out - clears both real auth and dev mode override
  Future<void> signOut() async {
    state = const AsyncValue.loading();
    await _authService.signOut();
    // Clear dev mode override
    ref.read(devModeAuthOverrideProvider.notifier).setAuthenticated(false);
    state = const AsyncValue.data(null);
  }
}

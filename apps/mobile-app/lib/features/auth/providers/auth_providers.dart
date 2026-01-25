import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

final isAuthenticatedProvider = Provider<bool>((ref) {
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
}

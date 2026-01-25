import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/auth/services/passcode_service.dart';

/// Provider for PasscodeService instance.
final passcodeServiceProvider = Provider((ref) => PasscodeService());

/// Provider to check if passcode exists.
final hasPasscodeProvider = FutureProvider<bool>((ref) async {
  final passcodeService = ref.watch(passcodeServiceProvider);
  return passcodeService.hasPasscode();
});

/// Provider to check if biometrics is enabled.
final isBiometricEnabledProvider = FutureProvider<bool>((ref) async {
  final passcodeService = ref.watch(passcodeServiceProvider);
  return passcodeService.isBiometricEnabled();
});

/// Provider to check if device supports biometrics.
final canUseBiometricsProvider = FutureProvider<bool>((ref) async {
  final passcodeService = ref.watch(passcodeServiceProvider);
  return passcodeService.canUseBiometrics();
});

/// Provider to refresh passcode-related state.
final refreshPasscodeProvider = Provider((ref) {
  return () {
    ref.invalidate(hasPasscodeProvider);
    ref.invalidate(isBiometricEnabledProvider);
  };
});

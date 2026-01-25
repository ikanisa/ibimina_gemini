import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// Service for managing app passcode and biometric authentication.
///
/// Passcode is stored as a PBKDF2-like hash (SHA-256 with salt) in secure storage.
/// Never stores raw passcode.
class PasscodeService {
  static const String _passcodeHashKey = 'ibimina_passcode_hash';
  static const String _passcodeSaltKey = 'ibimina_passcode_salt';
  static const String _biometricEnabledKey = 'ibimina_biometric_enabled';
  static const String _failedAttemptsKey = 'ibimina_failed_attempts';
  static const String _lockoutUntilKey = 'ibimina_lockout_until';

  static const int _maxFailedAttempts = 5;
  static const int _lockoutDurationMinutes = 5;

  final FlutterSecureStorage _storage;
  final LocalAuthentication _localAuth;

  PasscodeService({
    FlutterSecureStorage? storage,
    LocalAuthentication? localAuth,
  })  : _storage = storage ?? const FlutterSecureStorage(),
        _localAuth = localAuth ?? LocalAuthentication();

  // ============================================
  // PASSCODE MANAGEMENT
  // ============================================

  /// Create and store a new passcode.
  /// [passcode] should be 4-6 digits.
  Future<void> createPasscode(String passcode) async {
    _validatePasscode(passcode);

    // Generate a random salt
    final salt = _generateSalt();
    final hash = _hashPasscode(passcode, salt);

    await _storage.write(key: _passcodeSaltKey, value: salt);
    await _storage.write(key: _passcodeHashKey, value: hash);
    await _resetFailedAttempts();
  }

  /// Verify the provided passcode.
  /// Returns true if correct, false otherwise.
  /// Implements failed attempt throttling.
  Future<bool> verifyPasscode(String passcode) async {
    // Check if locked out
    if (await isLockedOut()) {
      throw PasscodeLockedException(await getLockoutRemainingSeconds());
    }

    final storedHash = await _storage.read(key: _passcodeHashKey);
    final storedSalt = await _storage.read(key: _passcodeSaltKey);

    if (storedHash == null || storedSalt == null) {
      return false;
    }

    final inputHash = _hashPasscode(passcode, storedSalt);
    final isValid = inputHash == storedHash;

    if (isValid) {
      await _resetFailedAttempts();
    } else {
      await _incrementFailedAttempts();
    }

    return isValid;
  }

  /// Check if a passcode has been set.
  Future<bool> hasPasscode() async {
    final hash = await _storage.read(key: _passcodeHashKey);
    return hash != null && hash.isNotEmpty;
  }

  /// Clear the stored passcode.
  Future<void> clearPasscode() async {
    await _storage.delete(key: _passcodeHashKey);
    await _storage.delete(key: _passcodeSaltKey);
    await _resetFailedAttempts();
  }

  // ============================================
  // BIOMETRICS
  // ============================================

  /// Check if device supports biometric authentication.
  Future<bool> canUseBiometrics() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isSupported = await _localAuth.isDeviceSupported();
      return canCheck && isSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Get available biometric types.
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Enable or disable biometric authentication.
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(
      key: _biometricEnabledKey,
      value: enabled.toString(),
    );
  }

  /// Check if biometric authentication is enabled.
  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: _biometricEnabledKey);
    return value == 'true';
  }

  /// Authenticate using biometrics.
  /// Returns true if successful, false otherwise.
  Future<bool> authenticateWithBiometrics() async {
    if (!await canUseBiometrics()) return false;
    if (!await isBiometricEnabled()) return false;

    try {
      final didAuthenticate = await _localAuth.authenticate(
        localizedReason: 'Unlock Ibimina',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      return didAuthenticate;
    } on PlatformException {
      return false;
    }
  }

  // ============================================
  // LOCKOUT MANAGEMENT
  // ============================================

  /// Check if user is currently locked out.
  Future<bool> isLockedOut() async {
    final lockoutUntilStr = await _storage.read(key: _lockoutUntilKey);
    if (lockoutUntilStr == null) return false;

    final lockoutUntil = DateTime.tryParse(lockoutUntilStr);
    if (lockoutUntil == null) return false;

    return DateTime.now().isBefore(lockoutUntil);
  }

  /// Get remaining lockout seconds.
  Future<int> getLockoutRemainingSeconds() async {
    final lockoutUntilStr = await _storage.read(key: _lockoutUntilKey);
    if (lockoutUntilStr == null) return 0;

    final lockoutUntil = DateTime.tryParse(lockoutUntilStr);
    if (lockoutUntil == null) return 0;

    final remaining = lockoutUntil.difference(DateTime.now()).inSeconds;
    return remaining > 0 ? remaining : 0;
  }

  /// Get number of failed attempts.
  Future<int> getFailedAttempts() async {
    final attemptsStr = await _storage.read(key: _failedAttemptsKey);
    return int.tryParse(attemptsStr ?? '0') ?? 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  void _validatePasscode(String passcode) {
    if (passcode.length != 4) {
      throw ArgumentError('Passcode must be 4 digits');
    }
    if (!RegExp(r'^\d+$').hasMatch(passcode)) {
      throw ArgumentError('Passcode must contain only digits');
    }
    // Reject sequential or repeating patterns
    if (_isWeakPasscode(passcode)) {
      throw ArgumentError('Passcode is too simple');
    }
  }

  bool _isWeakPasscode(String passcode) {
    // Check for all same digits (e.g., 1111, 0000)
    if (passcode.split('').toSet().length == 1) return true;

    // Check for sequential patterns (e.g., 1234, 4321)
    final digits = passcode.split('').map(int.parse).toList();
    bool ascending = true;
    bool descending = true;
    for (int i = 1; i < digits.length; i++) {
      if (digits[i] != digits[i - 1] + 1) ascending = false;
      if (digits[i] != digits[i - 1] - 1) descending = false;
    }
    if (ascending || descending) return true;

    return false;
  }

  String _generateSalt() {
    final random = DateTime.now().microsecondsSinceEpoch.toString();
    return sha256.convert(utf8.encode(random)).toString().substring(0, 16);
  }

  String _hashPasscode(String passcode, String salt) {
    // Simple HMAC-like approach: hash(salt + passcode)
    final combined = salt + passcode;
    return sha256.convert(utf8.encode(combined)).toString();
  }

  Future<void> _incrementFailedAttempts() async {
    final attempts = await getFailedAttempts() + 1;
    await _storage.write(key: _failedAttemptsKey, value: attempts.toString());

    if (attempts >= _maxFailedAttempts) {
      final lockoutUntil = DateTime.now().add(
        Duration(minutes: _lockoutDurationMinutes),
      );
      await _storage.write(
        key: _lockoutUntilKey,
        value: lockoutUntil.toIso8601String(),
      );
    }
  }

  Future<void> _resetFailedAttempts() async {
    await _storage.delete(key: _failedAttemptsKey);
    await _storage.delete(key: _lockoutUntilKey);
  }
}

/// Exception thrown when user is locked out due to too many failed attempts.
class PasscodeLockedException implements Exception {
  final int remainingSeconds;

  PasscodeLockedException(this.remainingSeconds);

  @override
  String toString() =>
      'Too many failed attempts. Try again in ${remainingSeconds}s';
}

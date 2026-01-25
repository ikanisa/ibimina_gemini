import 'package:flutter/foundation.dart';

/// Privacy-safe logging utility for Ibimina.
///
/// - Masks phone numbers
/// - Masks UUIDs/tokens
/// - Respects release mode (no logs in production)
class AppLogger {
  static const String _uuidPattern =
      r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  static const String _phonePattern = r'\+?[0-9]{10,15}';

  /// Log a debug message (only in debug mode).
  /// Automatically masks sensitive data.
  static void debug(String message, {String? tag}) {
    if (kReleaseMode) return;

    final maskedMessage = _maskSensitiveData(message);
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$prefix$maskedMessage');
  }

  /// Log an info message (only in debug mode).
  static void info(String message, {String? tag}) {
    debug('[INFO] $message', tag: tag);
  }

  /// Log a warning message (only in debug mode).
  static void warn(String message, {String? tag}) {
    debug('[WARN] $message', tag: tag);
  }

  /// Log an error message (always logged, but still masked).
  static void error(String message, {Object? error, StackTrace? stackTrace, String? tag}) {
    final maskedMessage = _maskSensitiveData(message);
    final prefix = tag != null ? '[$tag] ' : '';
    
    if (kReleaseMode) {
      // In production, you might want to send to crash reporting
      // For now, we just suppress detailed output
      return;
    }
    
    debugPrint('$prefix[ERROR] $maskedMessage');
    if (error != null) {
      debugPrint('Error: ${_maskSensitiveData(error.toString())}');
    }
    if (stackTrace != null && kDebugMode) {
      debugPrint('Stack: $stackTrace');
    }
  }

  /// Mask sensitive data in a string.
  static String _maskSensitiveData(String input) {
    var result = input;

    // Mask UUIDs (tokens, IDs)
    result = result.replaceAllMapped(
      RegExp(_uuidPattern),
      (match) => _maskUuid(match.group(0)!),
    );

    // Mask phone numbers
    result = result.replaceAllMapped(
      RegExp(_phonePattern),
      (match) => _maskPhone(match.group(0)!),
    );

    return result;
  }

  /// Mask a UUID, keeping first 4 and last 4 chars.
  static String _maskUuid(String uuid) {
    if (uuid.length < 12) return '***';
    return '${uuid.substring(0, 4)}****${uuid.substring(uuid.length - 4)}';
  }

  /// Mask a phone number, keeping country code and last 3 digits.
  static String _maskPhone(String phone) {
    if (phone.length < 7) return '***';
    final hasPlus = phone.startsWith('+');
    final prefix = hasPlus ? phone.substring(0, 4) : phone.substring(0, 3);
    final suffix = phone.substring(phone.length - 3);
    return '$prefix****$suffix';
  }

  /// Validate if a string looks like a valid UUID.
  static bool isValidUuid(String value) {
    return RegExp('^$_uuidPattern\$').hasMatch(value);
  }

  /// Mask a value for display in UI (e.g., settings screen).
  static String maskForDisplay(String value, {MaskType type = MaskType.auto}) {
    switch (type) {
      case MaskType.phone:
        return _maskPhone(value);
      case MaskType.uuid:
        return _maskUuid(value);
      case MaskType.auto:
        if (RegExp(_uuidPattern).hasMatch(value)) {
          return _maskUuid(value);
        }
        if (RegExp(_phonePattern).hasMatch(value)) {
          return _maskPhone(value);
        }
        // Generic masking for unknown sensitive data
        if (value.length > 8) {
          return '${value.substring(0, 3)}***${value.substring(value.length - 3)}';
        }
        return '***';
    }
  }
}

/// Types of data to mask.
enum MaskType {
  phone,
  uuid,
  auto,
}

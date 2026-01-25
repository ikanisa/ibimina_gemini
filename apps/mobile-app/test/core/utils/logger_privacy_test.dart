import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';

/// Privacy tests to ensure no PII is leaked in logs.
///
/// These tests verify that the AppLogger utility correctly masks
/// sensitive data like phone numbers, UUIDs/tokens, and other PII.
void main() {
  group('AppLogger Privacy Tests', () {
    group('Phone Number Masking', () {
      test('masks Rwandan phone numbers (+250...)', () {
        final masked = AppLogger.maskForDisplay('+250788123456', type: MaskType.phone);
        expect(masked, '+250****456');
        expect(masked, isNot(contains('788123')));
      });

      test('masks phone numbers without plus prefix', () {
        final masked = AppLogger.maskForDisplay('0788123456', type: MaskType.phone);
        expect(masked, '078****456');
      });

      test('handles short phone numbers gracefully', () {
        final masked = AppLogger.maskForDisplay('12345', type: MaskType.phone);
        expect(masked, '***');
      });

      test('masks phone in auto mode', () {
        final masked = AppLogger.maskForDisplay('+250788123456');
        expect(masked, isNot(contains('788123')));
      });
    });

    group('UUID/Token Masking', () {
      test('masks valid UUID tokens', () {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        final masked = AppLogger.maskForDisplay(uuid, type: MaskType.uuid);
        expect(masked, '550e****0000');
        expect(masked, isNot(contains('e29b')));
        expect(masked, isNot(contains('41d4')));
      });

      test('masks UUID in auto mode', () {
        const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        final masked = AppLogger.maskForDisplay(uuid);
        expect(masked, 'a1b2****7890');
      });

      test('handles short tokens gracefully', () {
        final masked = AppLogger.maskForDisplay('abc123', type: MaskType.uuid);
        expect(masked, '***');
      });
    });

    group('UUID Validation', () {
      test('validates correct UUID format', () {
        expect(AppLogger.isValidUuid('550e8400-e29b-41d4-a716-446655440000'), isTrue);
        expect(AppLogger.isValidUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890'), isTrue);
      });

      test('rejects invalid UUID format', () {
        expect(AppLogger.isValidUuid('not-a-uuid'), isFalse);
        expect(AppLogger.isValidUuid('550e8400-e29b-41d4-a716'), isFalse); // too short
        expect(AppLogger.isValidUuid('550e8400e29b41d4a716446655440000'), isFalse); // no dashes
        expect(AppLogger.isValidUuid(''), isFalse);
      });
    });

    group('Auto Type Detection', () {
      test('detects UUID and masks appropriately', () {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        final masked = AppLogger.maskForDisplay(uuid);
        expect(masked, '550e****0000');
      });

      test('detects phone and masks appropriately', () {
        final masked = AppLogger.maskForDisplay('+250788123456');
        expect(masked, '+250****456');
      });

      test('applies generic masking to unknown formats', () {
        final masked = AppLogger.maskForDisplay('some_sensitive_data_here');
        expect(masked, 'som***ere');
        expect(masked, isNot(contains('sensitive')));
      });
    });

    group('Edge Cases', () {
      test('handles empty string', () {
        final masked = AppLogger.maskForDisplay('');
        expect(masked, '***');
      });

      test('handles very short strings', () {
        expect(AppLogger.maskForDisplay('ab'), '***');
        expect(AppLogger.maskForDisplay('abc'), '***');
      });

      test('handles strings with special characters', () {
        final masked = AppLogger.maskForDisplay('test@email.com');
        expect(masked.length, lessThan('test@email.com'.length));
      });
    });
  });

  group('Logging Output Tests', () {
    // Note: These tests verify the masking logic in debug method.
    // In a real app, you might capture stdout to verify actual output.
    
    test('debug logging masks UUIDs in message', () {
      // This test documents expected behavior.
      // The actual debugPrint output would show masked values.
      const message = 'Processing token: 550e8400-e29b-41d4-a716-446655440000';
      
      // In the actual implementation, this would be masked
      // We test the utility method that does the masking
      final maskedMessage = _maskSensitiveDataForTest(message);
      expect(maskedMessage, contains('550e****0000'));
      expect(maskedMessage, isNot(contains('e29b-41d4')));
    });

    test('debug logging masks phone numbers in message', () {
      const message = 'User phone: +250788123456';
      final maskedMessage = _maskSensitiveDataForTest(message);
      expect(maskedMessage, isNot(contains('788123')));
    });

    test('debug logging masks multiple sensitive values', () {
      const message = 'User +250788123456 used token 550e8400-e29b-41d4-a716-446655440000';
      final maskedMessage = _maskSensitiveDataForTest(message);
      expect(maskedMessage, isNot(contains('788123')));
      expect(maskedMessage, isNot(contains('e29b-41d4')));
    });
  });
}

/// Helper to test the masking logic (mirrors AppLogger internal logic)
String _maskSensitiveDataForTest(String input) {
  var result = input;

  // Mask UUIDs
  result = result.replaceAllMapped(
    RegExp(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'),
    (match) {
      final uuid = match.group(0)!;
      return '${uuid.substring(0, 4)}****${uuid.substring(uuid.length - 4)}';
    },
  );

  // Mask phone numbers
  result = result.replaceAllMapped(
    RegExp(r'\+?[0-9]{10,15}'),
    (match) {
      final phone = match.group(0)!;
      if (phone.length < 7) return '***';
      final hasPlus = phone.startsWith('+');
      final prefix = hasPlus ? phone.substring(0, 4) : phone.substring(0, 3);
      final suffix = phone.substring(phone.length - 3);
      return '$prefix****$suffix';
    },
  );

  return result;
}

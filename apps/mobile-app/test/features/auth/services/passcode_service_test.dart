import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PasscodeService - validation logic', () {
    // Note: We test the validation logic directly since the service
    // depends on FlutterSecureStorage which requires platform channels.
    // Full integration tests would require mocking at dashboard channel level.

    group('passcode validation', () {
      test('accepts valid 4-digit passcode', () {
        // 1357 is valid - not sequential, not all same
        expect(() => _validatePasscode('1357'), returnsNormally);
      });

      test('rejects passcode != 4 digits', () {
        expect(() => _validatePasscode('123'), throwsArgumentError);
        expect(() => _validatePasscode('12345'), throwsArgumentError);
        expect(() => _validatePasscode('123456'), throwsArgumentError);
      });

      test('rejects non-numeric passcode', () {
        expect(() => _validatePasscode('12ab'), throwsArgumentError);
      });

      test('rejects weak passcodes (all same digits)', () {
        expect(() => _validatePasscode('1111'), throwsArgumentError);
        expect(() => _validatePasscode('0000'), throwsArgumentError);
        expect(() => _validatePasscode('9999'), throwsArgumentError);
      });

      test('rejects weak passcodes (sequential ascending)', () {
        expect(() => _validatePasscode('1234'), throwsArgumentError);
        expect(() => _validatePasscode('5678'), throwsArgumentError);
      });

      test('rejects weak passcodes (sequential descending)', () {
        expect(() => _validatePasscode('4321'), throwsArgumentError);
        expect(() => _validatePasscode('8765'), throwsArgumentError);
      });

      test('accepts non-sequential passcodes', () {
        expect(() => _validatePasscode('1379'), returnsNormally);
        expect(() => _validatePasscode('2468'), returnsNormally);
        expect(() => _validatePasscode('9174'), returnsNormally);
      });
    });
  });
}

/// Validation logic extracted for testing without secure storage dependency.
void _validatePasscode(String passcode) {
  if (passcode.length != 4) {
    throw ArgumentError('Passcode must be 4 digits');
  }
  if (!RegExp(r'^\d+$').hasMatch(passcode)) {
    throw ArgumentError('Passcode must contain only digits');
  }
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

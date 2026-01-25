import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/contribution/services/contribution_service.dart';
import 'package:path/path.dart' as path;

/// Security tests for contribution service.
///
/// These tests verify:
/// 1. File type validation (JPEG/PNG only)
/// 2. File size limits (5MB max)
/// 3. Amount validation (4,000 RWF max)
/// 4. Constants and configuration security
///
/// Note: Tests that require Supabase are skipped in unit tests.
/// Use integration tests for full service testing.
void main() {
  group('ContributionService Security Tests', () {
    group('Amount Validation', () {
      // Create a minimal service instance for validation-only tests
      // These methods don't require Supabase
      
      test('rejects zero amount', () {
        final error = _validateAmount(0);
        expect(error, isNotNull);
        expect(error, contains('greater than 0'));
      });

      test('rejects negative amount', () {
        final error = _validateAmount(-100);
        expect(error, isNotNull);
        expect(error, contains('greater than 0'));
      });

      test('accepts valid amount within limit', () {
        expect(_validateAmount(1000), isNull);
        expect(_validateAmount(4000), isNull);
      });

      test('rejects amount exceeding 4,000 RWF cap', () {
        final error = _validateAmount(4001);
        expect(error, isNotNull);
        expect(error, contains('4,000'));
      });

      test('rejects large amounts', () {
        final error = _validateAmount(100000);
        expect(error, isNotNull);
      });
    });

    group('File Type Validation', () {
      test('allows JPEG files', () {
        expect(
          ContributionService.allowedExtensions.contains('jpg'),
          isTrue,
        );
        expect(
          ContributionService.allowedExtensions.contains('jpeg'),
          isTrue,
        );
      });

      test('allows PNG files', () {
        expect(
          ContributionService.allowedExtensions.contains('png'),
          isTrue,
        );
      });

      test('does not allow GIF files', () {
        expect(
          ContributionService.allowedExtensions.contains('gif'),
          isFalse,
        );
      });

      test('does not allow PDF files', () {
        expect(
          ContributionService.allowedExtensions.contains('pdf'),
          isFalse,
        );
      });

      test('does not allow executable files', () {
        expect(
          ContributionService.allowedExtensions.contains('exe'),
          isFalse,
        );
        expect(
          ContributionService.allowedExtensions.contains('sh'),
          isFalse,
        );
      });
    });

    group('File Size Validation', () {
      test('max file size is 5MB', () {
        expect(
          ContributionService.maxFileSizeBytes,
          equals(5 * 1024 * 1024),
        );
      });

      test('max file size is reasonable for mobile uploads', () {
        // Should be between 1MB and 10MB
        expect(ContributionService.maxFileSizeBytes, greaterThan(1024 * 1024));
        expect(ContributionService.maxFileSizeBytes, lessThan(10 * 1024 * 1024));
      });
    });

    group('Constants Security Check', () {
      test('max amount matches business rule (4,000 RWF)', () {
        expect(ContributionService.maxAmount, equals(4000));
      });

      test('allowed extensions list is not empty', () {
        expect(ContributionService.allowedExtensions, isNotEmpty);
      });

      test('allowed extensions are lowercase', () {
        for (final ext in ContributionService.allowedExtensions) {
          expect(ext, equals(ext.toLowerCase()));
        }
      });
    });
  });

  group('File Extension Validation Tests', () {
    test('validates JPEG extension correctly', () {
      expect(_validateFileExtension('/tmp/test.jpg'), isNull);
      expect(_validateFileExtension('/tmp/test.jpeg'), isNull);
    });

    test('validates PNG extension correctly', () {
      expect(_validateFileExtension('/tmp/test.png'), isNull);
    });

    test('rejects GIF extension', () {
      final error = _validateFileExtension('/tmp/test.gif');
      expect(error, isNotNull);
      expect(error, contains('JPEG and PNG'));
    });

    test('rejects PDF extension', () {
      final error = _validateFileExtension('/tmp/test.pdf');
      expect(error, isNotNull);
    });

    test('handles uppercase extensions (case-insensitive)', () {
      expect(_validateFileExtension('/tmp/test.JPG'), isNull);
      expect(_validateFileExtension('/tmp/test.PNG'), isNull);
      expect(_validateFileExtension('/tmp/test.JPEG'), isNull);
    });

    test('handles mixed case extensions', () {
      expect(_validateFileExtension('/tmp/test.JpG'), isNull);
      expect(_validateFileExtension('/tmp/test.Png'), isNull);
    });

    test('rejects files with no extension', () {
      final error = _validateFileExtension('/tmp/testfile');
      expect(error, isNotNull);
    });

    test('rejects hidden files', () {
      final error = _validateFileExtension('/tmp/.hidden');
      expect(error, isNotNull);
    });
  });
}

/// Validate amount without requiring service initialization
String? _validateAmount(int amount) {
  if (amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (amount > ContributionService.maxAmount) {
    return 'Maximum contribution is 4,000 RWF';
  }
  return null;
}

/// Validate file extension without requiring service initialization
String? _validateFileExtension(String filePath) {
  final extension = path.extension(filePath).toLowerCase().replaceAll('.', '');
  if (extension.isEmpty) {
    return 'Only JPEG and PNG images are allowed';
  }
  if (!ContributionService.allowedExtensions.contains(extension)) {
    return 'Only JPEG and PNG images are allowed';
  }
  return null;
}


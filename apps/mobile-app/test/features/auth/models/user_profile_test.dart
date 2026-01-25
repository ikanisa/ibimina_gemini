import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/auth/models/user_profile.dart';

void main() {
  group('UserProfile', () {
    test('fromJson creates valid profile', () {
      final json = {
        'id': 'profile-123',
        'user_id': 'user-456',
        'full_name': 'Jean Baptiste',
        'momo_number': '+250788123456',
        'whatsapp_number': '+250788123456',
        'created_at': '2025-01-25T10:00:00Z',
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.id, 'profile-123');
      expect(profile.userId, 'user-456');
      expect(profile.fullName, 'Jean Baptiste');
      expect(profile.momoNumber, '+250788123456');
      expect(profile.whatsappNumber, '+250788123456');
      expect(profile.isComplete, true);
    });

    test('isComplete returns false when fields are empty', () {
      final json = {
        'id': 'profile-123',
        'user_id': 'user-456',
        'full_name': '',
        'momo_number': '',
        'whatsapp_number': '',
        'created_at': '2025-01-25T10:00:00Z',
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.isComplete, false);
    });

    test('toJson returns correct map', () {
      final profile = UserProfile(
        id: 'profile-123',
        userId: 'user-456',
        fullName: 'Jean Baptiste',
        momoNumber: '+250788123456',
        whatsappNumber: '+250788123456',
        createdAt: DateTime.parse('2025-01-25T10:00:00Z'),
      );

      final json = profile.toJson();

      expect(json['id'], 'profile-123');
      expect(json['user_id'], 'user-456');
      expect(json['full_name'], 'Jean Baptiste');
    });

    test('copyWith creates new instance with updated fields', () {
      final profile = UserProfile(
        id: 'profile-123',
        userId: 'user-456',
        fullName: 'Jean Baptiste',
        momoNumber: '+250788123456',
        whatsappNumber: '+250788123456',
        createdAt: DateTime.parse('2025-01-25T10:00:00Z'),
      );

      final updated = profile.copyWith(fullName: 'Updated Name');

      expect(updated.fullName, 'Updated Name');
      expect(updated.momoNumber, profile.momoNumber);
      expect(updated.id, profile.id);
    });

    test('toString masks phone number', () {
      final profile = UserProfile(
        id: 'profile-123',
        userId: 'user-456',
        fullName: 'Jean Baptiste',
        momoNumber: '+250788123456',
        whatsappNumber: '+250788123456',
        createdAt: DateTime.parse('2025-01-25T10:00:00Z'),
      );

      final str = profile.toString();

      expect(str.contains('+250788123456'), false);
      expect(str.contains('****'), true);
    });
  });
}

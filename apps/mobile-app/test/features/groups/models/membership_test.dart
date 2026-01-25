import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';

void main() {
  group('GroupMembership', () {
    test('fromJson creates valid membership', () {
      final json = {
        'id': 'membership-123',
        'member_id': 'user-456',
        'group_id': 'group-789',
        'role': 'member',
        'created_at': '2025-01-25T10:00:00Z',
        'status': 'ACTIVE',
        'groups': {
          'id': 'group-789',
          'group_name': 'Test Savings Group',
          'description': 'A test group',
          'institution_id': 'inst-001',
          'created_at': '2025-01-01T00:00:00Z',
          'type': 'PRIVATE',
          'status': 'ACTIVE',
          'invite_code': 'ABC123'
        },
      };

      final membership = GroupMembership.fromJson(json);

      expect(membership.id, 'membership-123');
      expect(membership.userId, 'user-456');
      expect(membership.groupId, 'group-789');
      expect(membership.role, 'member');
      expect(membership.isActive, true);
      expect(membership.group?.name, 'Test Savings Group');
    });

    test('fromJson defaults role to MEMBER', () {
      final json = {
        'id': 'membership-123',
        'member_id': 'user-456',
        'group_id': 'group-789',
        'created_at': '2025-01-25T10:00:00Z',
      };

      final membership = GroupMembership.fromJson(json);

      expect(membership.role, 'MEMBER');
    });

    test('fromJson defaults status to GOOD_STANDING (isActive=true)', () {
      final json = {
        'id': 'membership-123',
        'member_id': 'user-456',
        'group_id': 'group-789',
        'created_at': '2025-01-25T10:00:00Z',
      };

      final membership = GroupMembership.fromJson(json);

      expect(membership.status, 'GOOD_STANDING');
      expect(membership.isActive, true);
    });

    test('toJson returns correct map', () {
      final membership = GroupMembership(
        id: 'membership-123',
        userId: 'user-456',
        groupId: 'group-789',
        institutionId: 'inst-001',
        role: 'owner',
        joinedAt: DateTime.parse('2025-01-25T10:00:00Z'),
        status: 'ACTIVE',
        group: Group(
          id: 'group-789',
          institutionId: 'inst-001',
          name: 'Test Group',
          createdAt: DateTime.parse('2025-01-01T00:00:00Z'),
          type: GroupType.private,
          status: 'ACTIVE',
        ),
      );

      final json = membership.toJson();

      expect(json['id'], 'membership-123');
      expect(json['member_id'], 'user-456');
      expect(json['group_id'], 'group-789');
      expect(json['role'], 'owner');
      expect(json['status'], 'ACTIVE');
    });
  });
}

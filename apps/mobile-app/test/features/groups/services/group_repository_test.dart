import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ibimina_mobile/features/groups/services/group_repository.dart';

// --- Custom Mock that behaves like a Future ---
import 'dart:async';

class MockPostgrestResponse<T> extends Mock implements PostgrestTransformBuilder<T> {
  final T _result;
  MockPostgrestResponse(this._result);

  @override
  Future<R> then<R>(FutureOr<R> Function(T value) onValue, {Function? onError}) {
    return Future.value(_result).then(onValue, onError: onError);
  }
}

// Basic mocks
class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockGoTrueClient extends Mock implements GoTrueClient {}
class MockUser extends Mock implements User {}
class MockSupabaseQueryBuilder extends Mock implements SupabaseQueryBuilder {}

// Typed Mocks matching Supabase v2 signatures
class MockPostgrestFilterBuilder extends Mock implements PostgrestFilterBuilder<List<Map<String, dynamic>>> {}

void main() {
  late GroupRepository repository;
  late MockSupabaseClient mockSupabase;
  late MockGoTrueClient mockAuth;
  late MockUser mockUser;

  setUp(() {
    mockSupabase = MockSupabaseClient();
    mockAuth = MockGoTrueClient();
    mockUser = MockUser();

    when(() => mockSupabase.auth).thenReturn(mockAuth);
    when(() => mockAuth.currentUser).thenReturn(mockUser);
    when(() => mockUser.id).thenReturn('user_123');
    
    registerFallbackValue(const []);
    
    repository = GroupRepository(supabase: mockSupabase);
  });

  group('GroupRepository.joinGroup', () {
    test('throws exception if user is already a member of an active group', () async {
      // 1. Mock profiles check
      final profileQB = MockSupabaseQueryBuilder();
      final profileFilter = MockPostgrestFilterBuilder();
      
      when(() => mockSupabase.from('profiles')).thenReturn(profileQB);
      when(() => profileQB.select(any())).thenReturn(profileFilter);
      when(() => profileFilter.eq(any(), any())).thenReturn(profileFilter);
      // single() returns Map<String, dynamic>
      when(() => profileFilter.single()).thenAnswer((_) => MockPostgrestResponse<Map<String, dynamic>>({'institution_id': 'inst_1'}));

      // 2. Mock members check
      final memberQB = MockSupabaseQueryBuilder();
      final memberFilter = MockPostgrestFilterBuilder();

      when(() => mockSupabase.from('members')).thenReturn(memberQB);
      when(() => memberQB.select(any())).thenReturn(memberFilter);
      when(() => memberFilter.eq(any(), any())).thenReturn(memberFilter);
      when(() => memberFilter.single()).thenAnswer((_) => MockPostgrestResponse<Map<String, dynamic>>({'id': 'mem_1'}));

      // 3. Mock group_members check
      final gmQB = MockSupabaseQueryBuilder();
      final gmFilter = MockPostgrestFilterBuilder();

      when(() => mockSupabase.from('group_members')).thenReturn(gmQB);
      when(() => gmQB.select(any())).thenReturn(gmFilter);
      when(() => gmFilter.eq(any(), any())).thenReturn(gmFilter);
      when(() => gmFilter.inFilter(any(), any())).thenReturn(gmFilter);
      
      final activeMembershipData = {
        'id': 'gm_1',
        'member_id': 'mem_1',
        'group_id': 'group_existing',
        'role': 'MEMBER',
        'status': 'GOOD_STANDING',
        'institution_id': 'inst_1',
        'created_at': DateTime.now().toIso8601String(),
        'groups': {
           'id': 'group_existing',
           'group_name': 'Existing Group',
           'institution_id': 'inst_1',
           'created_at': DateTime.now().toIso8601String(),
           'type': 'PRIVATE',
           'status': 'ACTIVE',
           'contribution_amount': 0,
           'frequency': 'MONTHLY',
        }
      };

      // maybeSingle returns Map<String, dynamic>?
      when(() => gmFilter.maybeSingle()).thenAnswer((_) => MockPostgrestResponse<Map<String, dynamic>?>(activeMembershipData));

      // Act & Assert
      expect(
        () => repository.joinGroup('SOME_CODE'),
        throwsA(
          isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('already a member'),
          ),
        ),
      );
    });
  });
}

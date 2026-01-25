import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/features/groups/screens/join_group_screen.dart';
import 'package:ibimina_mobile/features/groups/services/group_repository.dart';
import 'package:mocktail/mocktail.dart';

class MockGroupRepository extends Mock implements GroupRepository {}

void main() {
  late MockGroupRepository mockRepo;

  setUp(() {
    mockRepo = MockGroupRepository();
  });

  testWidgets('JoinGroupScreen redirects if user is already a member', (tester) async {
    // Arrange
    final activeMembership = GroupMembership(
      id: 'm1',
      userId: 'u1',
      groupId: 'g1',
      role: 'MEMBER',
      status: 'GOOD_STANDING',
      institutionId: 'inst_1',
      joinedAt: DateTime.now(),
      group: Group(
        id: 'g1',
        name: 'Existing Group',
        institutionId: 'inst_1',
        createdAt: DateTime.now(),
        type: GroupType.private,
      ),
    );

    when(() => mockRepo.getMyInstitutionId()).thenAnswer((_) async => 'inst_1');
    when(() => mockRepo.getMyMembership('inst_1')).thenAnswer((_) async => activeMembership);

    // Mock GoRouter to verify redirection
    final goRouter = GoRouter(
      initialLocation: '/join',
      routes: [
        GoRoute(
          path: '/join',
          builder: (context, state) => const JoinGroupScreen(),
        ),
        GoRoute(
          path: '/group/view',
          builder: (context, state) => const Scaffold(body: Text('Group Dashboard')),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          groupRepositoryProvider.overrideWithValue(mockRepo),
        ],
        child: MaterialApp.router(
          routerConfig: goRouter,
        ),
      ),
    );

    // Act
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Group Dashboard'), findsOneWidget);
    expect(find.text('You are already in a group.'), findsOneWidget);
  });

  testWidgets('JoinGroupScreen allows access if user is NOT a member', (tester) async {
    // Arrange: No membership
    when(() => mockRepo.getMyInstitutionId()).thenAnswer((_) async => 'inst_1');
    when(() => mockRepo.getMyMembership('inst_1')).thenThrow(Exception('No membership'));

    final goRouter = GoRouter(
      initialLocation: '/join',
      routes: [
        GoRoute(
          path: '/join',
          builder: (context, state) => const JoinGroupScreen(),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          groupRepositoryProvider.overrideWithValue(mockRepo),
        ],
        child: MaterialApp.router(
          routerConfig: goRouter,
        ),
      ),
    );

    // Act
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Join a Group'), findsOneWidget);
    expect(find.text('Group Dashboard'), findsNothing);
  });
}

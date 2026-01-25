import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/contribution/screens/contribute_screen.dart';
import 'package:ibimina_mobile/features/contribution/providers/contribution_providers.dart';
import 'package:ibimina_mobile/features/contribution/services/contribution_service.dart';
import 'package:mocktail/mocktail.dart';

class MockContributionService extends Mock implements ContributionService {}

void main() {
  late MockContributionService mockContributionService;

  setUp(() {
    mockContributionService = MockContributionService();
    
    // Default mocks
    when(() => mockContributionService.checkGroupMembership(any()))
        .thenAnswer((_) async => true);
    
    when(() => mockContributionService.validateAmount(any()))
        .thenAnswer((invocation) {
          final amount = invocation.positionalArguments[0] as int;
          if (amount > 4000) return 'Maximum contribution is 4,000 RWF';
          if (amount <= 0) return 'Amount must be greater than 0';
          return null;
        });

     when(() => mockContributionService.validateWalletCap(any(), any()))
        .thenAnswer((_) async => null); // Default no wallet error
     
     when(() => mockContributionService.launchMoMoUssd(any()))
        .thenAnswer((_) async => '*182*1*1*1000#');
  });

  Widget createWidgetUnderTest() {
    return ProviderScope(
      overrides: [
        contributionServiceProvider.overrideWithValue(mockContributionService),
      ],
      child: const MaterialApp(
        home: ContributeScreen(
          groupId: 'group-123',
          groupName: 'Test Group',
        ),
      ),
    );
  }

  testWidgets('shows validation error when amount is too high', (tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Enter invalid amount
    await tester.enterText(find.byType(TextField), '4001');
    await tester.tap(find.text('Pay via MoMo USSD'));
    await tester.pump(); // Start async
    await tester.pump(); // Complete async (logic is fast)

    // Verify error snackbar/message
    expect(find.text('Maximum contribution is 4,000 RWF'), findsOneWidget);
  });

  testWidgets('shows validation error when amount is zero or empty', (tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Basic empty/zero check (assuming button might process it)
    await tester.enterText(find.byType(TextField), '0');
    await tester.tap(find.text('Pay via MoMo USSD'));
     await tester.pump();
    await tester.pump();

    // The logic in screen might show "Enter checkGroupMembershipAmount must be greater than 0" or general "Enter a valid amount" depending on specific controller logic
    // The screen logic checks for <= 0 locally first and shows 'Enter a valid amount'
    expect(find.text('Enter a valid amount'), findsOneWidget);
  });

  testWidgets('shows USSD instructions on valid amount', (tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Enter valid amount
    await tester.enterText(find.byType(TextField), '1000');
    await tester.tap(find.text('Pay via MoMo USSD'));
    
    // Validations pass
    await tester.pumpAndSettle(); 

    // Expect Bottom Sheet
    expect(find.text('Complete Payment'), findsOneWidget);
    // Expect USSD code
    expect(find.text('*182*1*1*1000#'), findsOneWidget);
  });

   testWidgets('opens proof screen when "I have Paid" is tapped', (tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // trigger sheet
    await tester.enterText(find.byType(TextField), '1000');
    await tester.tap(find.text('Pay via MoMo USSD'));
    await tester.pumpAndSettle();

    // Tap "I have Paid"
    await tester.tap(find.text('I have Paid'));
    await tester.pumpAndSettle();

    // Verify Navigation to Proof Upload Screen
    expect(find.text('Confirm Payment'), findsOneWidget); // AppBar title of ProofScreen
    expect(find.text('Enter Transaction Details'), findsOneWidget);
  });
}

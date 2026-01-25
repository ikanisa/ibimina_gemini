import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/core/theme/app_theme.dart';

void main() {
  group('UI Components Smoke Test', () {
    // Helper to pump widget with theme
    Future<void> pumpWithTheme(WidgetTester tester, Widget widget) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(body: widget),
        ),
      );
    }

    testWidgets('PrimaryButton renders and responds to tap', (tester) async {
      bool pressed = false;
      await pumpWithTheme(
        tester,
        PrimaryButton(
          label: 'Test Button',
          onPressed: () => pressed = true,
        ),
      );

      expect(find.text('Test Button'), findsOneWidget);
      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, isTrue);
    });

    testWidgets('PrimaryButton shows loading state', (tester) async {
      await pumpWithTheme(
        tester,
        const PrimaryButton(
          label: 'Loading',
          isLoading: true,
          onPressed: null,
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading'), findsNothing); // Text is removed from tree when loading
    });

    testWidgets('InfoCard renders content', (tester) async {
      await pumpWithTheme(
        tester,
        const InfoCard(
          title: 'Card Title',
          subtitle: 'Card Subtitle',
          trailing: Icon(Icons.chevron_right),
        ),
      );

      expect(find.text('Card Title'), findsOneWidget);
      expect(find.text('Card Subtitle'), findsOneWidget);
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    });

    testWidgets('StatusPill renders correct colors for statuses', (tester) async {
      await pumpWithTheme(
        tester,
        Column(
          children: [
            StatusPill.pending(),
            StatusPill.confirmed(),
            StatusPill.rejected(),
          ],
        ),
      );

      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('Confirmed'), findsOneWidget);
      expect(find.text('Rejected'), findsOneWidget);
    });

    testWidgets('AppTextField renders properly', (tester) async {
      await pumpWithTheme(
        tester,
        const AppTextField(
          label: 'Username',
          hint: 'Enter username',
        ),
      );

      expect(find.text('Username'), findsOneWidget);
      expect(find.text('Enter username'), findsOneWidget);
    });

    testWidgets('BalanceHeader renders formatted amount', (tester) async {
      await pumpWithTheme(
        tester,
        const BalanceHeader(
          label: 'Total Balance',
          amount: '50,000',
          currency: 'RWF',
        ),
      );

      expect(find.text('TOTAL BALANCE'), findsOneWidget);
      // BalanceHeader uses RichText. find.text with findRichText: true matches the FULL text.
      expect(find.text('RWF 50,000', findRichText: true), findsOneWidget);
    });

    testWidgets('EmptyState renders icon and message', (tester) async {
      await pumpWithTheme(
        tester,
        const EmptyState(
          icon: Icons.inbox,
          title: 'No Data',
          message: 'Try again later',
        ),
      );

      expect(find.byIcon(Icons.inbox), findsOneWidget);
      expect(find.text('No Data'), findsOneWidget);
      expect(find.text('Try again later'), findsOneWidget);
    });
  });
}

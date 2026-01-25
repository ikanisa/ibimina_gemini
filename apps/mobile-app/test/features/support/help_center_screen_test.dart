import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/support/screens/help_center_screen.dart';

void main() {
  testWidgets('HelpCenterScreen renders correctly', (WidgetTester tester) async {
    // Build the HelpCenterScreen wrapped in MaterialApp
    await tester.pumpWidget(const MaterialApp(
      home: HelpCenterScreen(),
    ));

    // Verify title
    expect(find.text('Help Center'), findsOneWidget);

    // Verify search field
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Search help articles...'), findsOneWidget);

    // Verify Service Status (ServiceStatusWidget)
    // We look for the text "Service Status" which is inside the widget
    expect(find.text('Service Status'), findsOneWidget);
    expect(find.text('All systems operational'), findsOneWidget);

    // Verify Contact Support button
    expect(find.text('Contact Support'), findsOneWidget);
  });

  testWidgets('HelpCenterScreen search filters articles', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: HelpCenterScreen(),
    ));

    // Enter search text
    await tester.enterText(find.byType(TextField), 'join');
    await tester.pump();

    // Verify results
    // "How do I join a group?" should be visible
    expect(find.text('How do I join a group?'), findsOneWidget);
  });
}

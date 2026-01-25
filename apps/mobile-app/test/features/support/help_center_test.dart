import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/support/screens/help_center_screen.dart';

void main() {
  testWidgets('HelpCenterScreen shows categories and search bar',
      (WidgetTester tester) async {
    // Build the widget
    await tester.pumpWidget(const MaterialApp(
      home: HelpCenterScreen(),
    ));

    // Verify search bar exists
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Search help articles...'), findsOneWidget);

    // Verify categories (at least one known category from hardcoded data)
    expect(find.textContaining('Getting Started'), findsOneWidget);
    expect(find.textContaining('Contributions'), findsOneWidget);

    // Verify 'Contact Support' button exists
    expect(find.text('Contact Support'), findsOneWidget);
  });

  testWidgets('HelpCenterScreen search filters articles',
      (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: HelpCenterScreen(),
    ));

    // Enter search text "pending"
    await tester.enterText(find.byType(TextField), 'Pending');
    await tester.pump();

    // Verify filtered result is shown
    expect(find.text('Why is my contribution "Pending"?'), findsOneWidget);

    // Verify irrelevant article is hidden
    expect(find.text('How do I join a group?'), findsNothing);
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/theme/app_theme.dart';
import 'package:ibimina_mobile/features/auth/screens/login_screen.dart';

void main() {
  testWidgets('LoginScreen renders correctly', (WidgetTester tester) async {
    // Test LoginScreen in isolation
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.darkTheme,
          home: const LoginScreen(),
        ),
      ),
    );

    await tester.pump();

    // Verify key LoginScreen elements are present
    expect(find.text('Welcome to Ibimina'), findsOneWidget);
    expect(find.text('+250'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);
  });
}

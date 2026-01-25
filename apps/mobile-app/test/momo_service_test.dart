import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/momo/services/momo_service.dart';

void main() {
  group('MoMoService', () {
    final service = MoMoService();

    test('throws exception for invalid start code', () {
      expect(
        () => service.launchUssd('*123*8888#'),
        throwsException,
      );
    });

    test('throws exception for invalid end code', () {
      expect(
        () => service.launchUssd('*182*8888'),
        throwsException,
      );
    });

    // Note: We cannot easily test successful launchUrl in unit tests without mocking url_launcher platform interface.
    // For now, validation logic testing is sufficient for MVP.
  });
}

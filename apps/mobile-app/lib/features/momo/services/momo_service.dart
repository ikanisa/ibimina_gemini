import 'package:url_launcher/url_launcher.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';

class MoMoService {
  /// Launches the USSD code for MoMo payment.
  /// [ussdCode] must look like `*182*...#`.
  Future<void> launchUssd(String ussdCode) async {
    if (!ussdCode.startsWith('*182*') || !ussdCode.endsWith('#')) {
      throw Exception('Invalid MoMo USSD code. Must start with *182* and end with #');
    }

    // URL encoding for '#' is %23
    final encodedCode = ussdCode.replaceAll('#', '%23');
    final uri = Uri.parse('tel:$encodedCode');

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        throw Exception('Could not launch USSD dialer');
      }
    } catch (e) {
      AppLogger.error('MoMo USSD launch failed', error: e, tag: 'MoMo');
      rethrow;
    }
  }
}

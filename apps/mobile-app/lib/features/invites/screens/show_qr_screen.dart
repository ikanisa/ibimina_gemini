import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
// Check where AppColors is
import 'package:ibimina_mobile/ui/tokens/colors.dart'; // Assuming this is where it is based on scan
import 'package:ibimina_mobile/features/invites/services/qr_code_service.dart';

class ShowQRScreen extends StatefulWidget {
  final String title;
  final String description;
  final String data; // The raw string to encode (JSON or URL)

  const ShowQRScreen({
    super.key,
    required this.title,
    required this.description,
    required this.data,
  });

  /// Factory for Invite QR
  static Widget invite({
    required String token,
  }) {
    // Generate JSON payload
    final payload = QRCodeService.generateInvitePayload(token);
    return ShowQRScreen(
      title: 'Invite QR',
      description: 'Scan to join the group',
      data: payload,
    );
  }

  /// Factory for Contribution QR
  static Widget contribution({
    required String groupId,
    required int amount,
  }) {
    // Generate JSON payload
    final payload = QRCodeService.generateContributionPayload(groupId, amount);
    return ShowQRScreen(
      title: 'Contribution QR',
      description: 'Scan to pay $amount RWF',
      data: payload,
    );
  }

  @override
  State<ShowQRScreen> createState() => _ShowQRScreenState();
}

class _ShowQRScreenState extends State<ShowQRScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QR Code')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: widget.data,
                  version: QrVersions.auto,
                  size: 200.0,
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Point the Ibimina scanner at this code',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

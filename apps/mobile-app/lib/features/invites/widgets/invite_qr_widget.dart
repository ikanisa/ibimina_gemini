import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class InviteQRCodeWidget extends StatelessWidget {
  final String inviteUrl;
  final double size;

  const InviteQRCodeWidget({
    super.key,
    required this.inviteUrl,
    this.size = 200.0,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            QrImageView(
              data: inviteUrl,
              version: QrVersions.auto,
              size: size,
              backgroundColor: Colors.white,
            ),
            const SizedBox(height: 12),
            const Text(
              'Scan to Join',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

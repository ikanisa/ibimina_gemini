import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../ui/tokens/colors.dart';
import 'package:ibimina_mobile/core/constants/support_constants.dart';

class WhatsappHandoffSheet extends StatefulWidget {
  final String source;
  final String? transactionId;
  final String? submissionId;

  const WhatsappHandoffSheet({
    super.key,
    required this.source,
    this.transactionId,
    this.submissionId,
  });

  @override
  State<WhatsappHandoffSheet> createState() => _WhatsappHandoffSheetState();
}

class _WhatsappHandoffSheetState extends State<WhatsappHandoffSheet> {
  bool _includeTxId = false;
  // TODO: Add support number from config/env
  static const String _supportNumber = SupportConstants.supportWhatsappNumber;

  void _launchWhatsApp() async {
    final buffer = StringBuffer();
    buffer.write('Hi Ibimina Support, I need help.');
    buffer.write('\n\nContext: ${widget.source}');
    
    if (_includeTxId && widget.transactionId != null) {
      buffer.write('\nTxID: ${widget.transactionId}');
    }
    
    if (widget.submissionId != null) {
      // Submission ID is internal/opaque, generally safe, but we can toggle it too if strictly required.
      // For now, let's treat it as context.
      buffer.write('\nRef: ${widget.submissionId}');
    }

    final message = Uri.encodeComponent(buffer.toString());
    final url = Uri.parse('https://wa.me/$_supportNumber?text=$message');

    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open WhatsApp')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open WhatsApp')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasTxInfo = widget.transactionId != null;

    return Container(
      padding: const EdgeInsets.all(24),
      width: double.infinity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.support_agent, size: 32, color: AppColors.primary),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Contact Support',
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'We usually reply within 1 hour.',
                      style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.lightTextSecondary),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          if (hasTxInfo) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightSurfaceVariant,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.lightBorder),
              ),
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Include Transaction ID'),
                subtitle: const Text('Helps us find your issue faster.'),
                value: _includeTxId,
                onChanged: (val) => setState(() => _includeTxId = val),
              ),
            ),
            const SizedBox(height: 24),
          ],

          Text(
            'Privacy Note: We will open WhatsApp. Your phone number will be visible to our support staff.',
            style: theme.textTheme.bodySmall?.copyWith(color: AppColors.lightTextSecondary),
          ),
          
          const SizedBox(height: 24),
          
          ElevatedButton.icon(
            icon: const Icon(Icons.chat),
            label: const Text('Open WhatsApp'),
            onPressed: _launchWhatsApp,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366), // WhatsApp Green
              foregroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 24), // Bottom padding
        ],
      ),
    );
  }
}

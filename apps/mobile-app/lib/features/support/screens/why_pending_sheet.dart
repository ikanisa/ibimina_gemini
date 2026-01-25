import 'package:flutter/material.dart';
import '../../../../ui/tokens/colors.dart';
import 'whatsapp_handoff_sheet.dart';

class WhyPendingSheet extends StatelessWidget {
  final String submissionId;

  const WhyPendingSheet({
    super.key,
    required this.submissionId,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      width: double.infinity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.hourglass_empty, color: AppColors.warning, size: 28),
              const SizedBox(width: 12),
              Text(
                'Why is this Pending?',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          Text(
            'Your contribution is waiting for the Group Treasurer to confirm receipt.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Treasurers confirm transactions manually after checking their MoMo account. This typically takes a few hours, but depends on the group rules.',
            style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.lightTextSecondary),
          ),
          
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.lightSurfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'What can you do?',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                _buildTip(theme, 'Wait at least 24 hours.'),
                _buildTip(theme, 'Send a friendly reminder to your Treasurer.'),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.support_agent),
              label: const Text('It has been more than 24h'),
              onPressed: () {
                Navigator.pop(context);
                showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (context) => WhatsappHandoffSheet(
                      source: 'pending_too_long',
                      submissionId: submissionId,
                    ),
                  );
              },
            ),
          ),
           const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildTip(ThemeData theme, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

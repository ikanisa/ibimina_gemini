import 'package:flutter/material.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/support/screens/whatsapp_handoff_sheet.dart';

class WhyPendingSheet extends StatelessWidget {
  final String submissionId;

  const WhyPendingSheet({
    super.key,
    required this.submissionId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
         color: Theme.of(context).scaffoldBackgroundColor,
         borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionHeader(title: 'Why is this Pending?'),
          const SizedBox(height: AppSpacing.lg),
          
          InfoCard(
            title: 'Waiting for Treasurer',
            subtitle: 'Treasurers confirm transactions manually after checking their MoMo account. This typically takes a few hours.',
            leading: const Icon(Icons. hourglass_empty, color: AppColors.warning),
            backgroundColor: AppColors.surface,
          ),
          
          const SizedBox(height: AppSpacing.xl),
          
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'What can you do?',
                  style: AppTypography.titleSmall,
                ),
                const SizedBox(height: AppSpacing.md),
                _buildTip('Wait at least 24 hours.'),
                _buildTip('Send a friendly reminder to your Treasurer.'),
              ],
            ),
          ),
          
          const SizedBox(height: AppSpacing.xl),
          
          SecondaryButton(
            label: 'It has been more than 24h',
            icon: Icons.support_agent,
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
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }

  Widget _buildTip(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Expanded(child: Text(text, style: AppTypography.bodyMedium)),
        ],
      ),
    );
  }
}

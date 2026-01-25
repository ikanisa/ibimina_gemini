import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';

class FixRejectedSubmissionScreen extends StatefulWidget {
  final Transaction transaction;

  const FixRejectedSubmissionScreen({
    super.key,
    required this.transaction,
  });

  @override
  State<FixRejectedSubmissionScreen> createState() => _FixRejectedSubmissionScreenState();
}

class _FixRejectedSubmissionScreenState extends State<FixRejectedSubmissionScreen> {
  late TextEditingController _txIdController;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _txIdController = TextEditingController(text: widget.transaction.transactionId);
  }

  @override
  void dispose() {
    _txIdController.dispose();
    super.dispose();
  }

  Future<void> _submitFix() async {
    if (_txIdController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Transaction ID')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final ledgerService = LedgerService(); 
      
      await ledgerService.updateTransaction(
        transactionId: widget.transaction.id, 
        newMoMoTransactionId: _txIdController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Submission updated. Status is now Pending.')),
        );
        Navigator.pop(context); // Go back
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating submission: $e')),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Fix Submission')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Rejection Notice
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                   const Icon(Icons.error_outline, color: AppColors.error),
                   const SizedBox(width: AppSpacing.md),
                   Expanded(
                     child: Text(
                       'This submission was rejected. Please verify the details and try again.',
                       style: AppTypography.bodySmall.copyWith(color: AppColors.error),
                     ),
                   ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // Amount Read-Only
            const Text(
              'Amount',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '${widget.transaction.amount.toInt()} RWF',
              style: AppTypography.displayMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            
            const SizedBox(height: AppSpacing.xl),

            // TxID Field
            AppTextField(
              controller: _txIdController,
              label: 'MoMo Transaction ID',
              hint: 'e.g. 123456789',
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            
            const SizedBox(height: AppSpacing.md),
            const Text(
               'Check your SMS from MTN MoMo to find the correct ID.',
               style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),

            const SizedBox(height: AppSpacing.xxl),

            // Submit Button
            PrimaryButton(
               label: 'Resubmit for Approval',
               isLoading: _isSubmitting,
               onPressed: _submitFix,
            ),
          ],
        ),
      ),
    );
  }
}

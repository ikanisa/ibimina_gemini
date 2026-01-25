import 'package:flutter/material.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
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
      // Create a service instance (in a full Riverpod app we'd read the provider)
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fix Submission'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Rejection Notice
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                   const Icon(Icons.error_outline, color: AppColors.error),
                   const SizedBox(width: 12),
                   Expanded(
                     child: Text(
                       'This submission was rejected. Please verify the details and try again.',
                       style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                         color: AppColors.error,
                       ),
                     ),
                   ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Amount (Read only)
            Text(
              'Amount',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.transaction.amount.toInt()} RWF',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),

            // TxID Field
            Text(
              'MoMo Transaction ID',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _txIdController,
              decoration: const InputDecoration(
                hintText: 'e.g. 123456789',
                border: OutlineInputBorder(),
                helperText: 'Check the SMS from MTN MoMo',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                onPressed: _isSubmitting ? null : _submitFix,
                child: _isSubmitting 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Resubmit for Approval'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

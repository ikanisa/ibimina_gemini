import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/contribution/providers/contribution_providers.dart';
import 'package:ibimina_mobile/features/ledger/providers/ledger_providers.dart';

class ProofUploadScreen extends ConsumerStatefulWidget {
  final String groupId;
  final String groupName;
  final int amount;

  const ProofUploadScreen({
    super.key,
    required this.groupId,
    required this.groupName,
    required this.amount,
  });

  @override
  ConsumerState<ProofUploadScreen> createState() => _ProofUploadScreenState();
}

class _ProofUploadScreenState extends ConsumerState<ProofUploadScreen> {
  final _transactionIdController = TextEditingController();
  File? _proofFile;
  bool _isUploading = false;

  @override
  void dispose() {
    _transactionIdController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(bool fromCamera) async {
    final service = ref.read(contributionServiceProvider);
    try {
      final file = await service.pickProofImage(fromCamera: fromCamera);
      if (file != null) {
        setState(() => _proofFile = file);
      }
    } catch (e) {
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _submit() async {
    final txId = _transactionIdController.text.trim();
    if (txId.isEmpty) {
      _showError('Please enter the MoMo Transaction ID');
      return;
    }

    setState(() => _isUploading = true);

    try {
      final service = ref.read(contributionServiceProvider);
      String? proofUrl;

      // Upload proof if selected
      if (_proofFile != null) {
        proofUrl = await service.uploadProof(_proofFile!, widget.groupId);
      }

      // Record pending transaction
      await service.recordPendingContribution(
        groupId: widget.groupId,
        amount: widget.amount,
        proofUrl: proofUrl,
        transactionId: txId,
      );

      // Refresh ledger
      ref.invalidate(groupTransactionsProvider(widget.groupId));

      if (mounted) {
        Navigator.popUntil(context, (route) => route.isFirst);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contribution submitted! Pending verification.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      _showError('Failed to submit. Please try again.');
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Confirm Payment')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SectionHeader(title: 'Transaction Details'),
            const SizedBox(height: AppSpacing.md),
            
            const Text(
              'Enter the MoMo Transaction ID found in your SMS confirmation.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.lg),
            
            AppTextField(
              controller: _transactionIdController,
              label: 'Transaction ID',
              hint: 'e.g., 8295671',
              enabled: !_isUploading,
              keyboardType: TextInputType.text, // Usually numeric but safeguard
              validator: (v) => v == null || v.length < 5 ? 'Invalid ID' : null,
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            const SectionHeader(title: 'Proof of Payment (Optional)'),
             const SizedBox(height: AppSpacing.md),

            if (_proofFile != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Image.file(
                  _proofFile!,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton.icon(
                onPressed: _isUploading ? null : () => setState(() => _proofFile = null),
                icon: const Icon(Icons.delete_outline, color: AppColors.error),
                label: const Text('Remove Image', style: TextStyle(color: AppColors.error)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
              ),
            ] else ...[
              Container(
                height: 140,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.outline, style: BorderStyle.solid),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_upload_outlined, size: 40, color: AppColors.textSecondary),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Upload screenshot of SMS/Transaction', style: AppTypography.bodySmall),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      label: 'Camera',
                      icon: Icons.camera_alt_outlined,
                      onPressed: _isUploading ? null : () => _pickImage(true),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: SecondaryButton(
                      label: 'Gallery',
                      icon: Icons.photo_library_outlined,
                      onPressed: _isUploading ? null : () => _pickImage(false),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: AppSpacing.xxl),
            
            PrimaryButton(
              label: 'Submit Contribution',
              isLoading: _isUploading,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
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
    final file = await service.pickProofImage(fromCamera: fromCamera);
    if (file != null) {
      setState(() => _proofFile = file);
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Payment'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Enter Transaction Details',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter the MoMo Transaction ID (required) and upload a screenshot (optional).',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 32),
                
                // Transaction ID Field
                Text(
                  'Transaction ID',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _transactionIdController,
                  decoration: InputDecoration(
                    hintText: 'e.g., 12345678',
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Proof Upload Section
                Text(
                  'Proof Screenshot (Optional)',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 8),
                if (_proofFile != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(
                      _proofFile!,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: TextButton.icon(
                      onPressed: () => setState(() => _proofFile = null),
                      icon: const Icon(Icons.delete_outline),
                      label: const Text('Remove image'),
                      style: TextButton.styleFrom(foregroundColor: AppColors.error),
                    ),
                  ),
                ] else ...[
                  Container(
                    height: 160,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.surfaceLight,
                        width: 2,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.image_outlined,
                          size: 48,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Upload Screenshot',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickImage(true),
                          icon: const Icon(Icons.camera_alt_outlined),
                          label: const Text('Camera'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickImage(false),
                          icon: const Icon(Icons.photo_library_outlined),
                          label: const Text('Gallery'),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isUploading ? null : _submit,
                    child: _isUploading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Submit Contribution'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

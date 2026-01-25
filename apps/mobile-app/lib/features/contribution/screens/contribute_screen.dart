import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/contribution/providers/contribution_providers.dart';
import 'package:ibimina_mobile/features/contribution/screens/proof_upload_screen.dart';

class ContributeScreen extends ConsumerStatefulWidget {
  final String groupId;
  final String groupName;
  final int? initialAmount;

  const ContributeScreen({
    super.key,
    required this.groupId,
    required this.groupName,
    this.initialAmount,
  });

  @override
  ConsumerState<ContributeScreen> createState() => _ContributeScreenState();
}

class _ContributeScreenState extends ConsumerState<ContributeScreen> {
  late final TextEditingController _amountController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(
      text: widget.initialAmount?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _handleContribution() async {
    final amountText = _amountController.text.replaceAll(',', '');
    final amount = int.tryParse(amountText);

    if (amount == null || amount <= 0) {
      _showError('Enter a valid amount');
      return;
    }

    setState(() => _isLoading = true);
    final service = ref.read(contributionServiceProvider);

    try {
      // 0. Check Group Membership
      final isMember = await service.checkGroupMembership(widget.groupId);
      if (!isMember) {
        _showError('You must be a member of this group to contribute.');
        setState(() => _isLoading = false);
        return;
      }

      // 1. Validate Amount (Max 4k)
      final amountError = service.validateAmount(amount);
      if (amountError != null) {
        _showError(amountError);
        setState(() => _isLoading = false);
        return;
      }

      // 2. Validate Wallet Cap (Max 500k)
      final walletError = await service.validateWalletCap(widget.groupId, amount);
      if (walletError != null) {
        _showError(walletError);
        setState(() => _isLoading = false);
        return;
      }

      setState(() => _isLoading = false);
      if (!mounted) return;

      // 3. Show Instructions
      _showUSSDInstructions(amount);

    } catch (e) {
      _showError('Unexpected error: $e');
      setState(() => _isLoading = false);
    }
  }

  void _showUSSDInstructions(int amount) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent, // Let Container handle it
      builder: (context) {
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
              const Center(child: SectionHeader(title: 'Complete Payment')),
              const SizedBox(height: AppSpacing.lg),
              
              InfoCard(
                title: 'Step 1: Dial Code',
                subtitle: 'Dial *182*...# to approve payment via MoMo.',
                leading: const Icon(Icons.dialpad, color: AppColors.primary),
              ),
              const SizedBox(height: AppSpacing.md),
               InfoCard(
                title: 'Step 2: Confirm',
                subtitle: 'Approve the payment of $amount RWF.',
                leading: const Icon(Icons.fingerprint, color: AppColors.primary),
              ),
               const SizedBox(height: AppSpacing.md),
               InfoCard(
                title: 'Step 3: Return',
                subtitle: 'Come back here to upload proof.',
                leading: const Icon(Icons.upload_file, color: AppColors.primary),
              ),

              const SizedBox(height: AppSpacing.xl),
              
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.lightBorder),
                ),
                child: Column(
                  children: [
                    Text(
                      '*182*1*1*$amount#',
                      style: AppTypography.displayMedium.copyWith(
                            color: AppColors.primary,
                            letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text('Tap below to open dialer', style: AppTypography.bodySmall),
                  ],
                ),
              ),
              
              const SizedBox(height: AppSpacing.xxl),
              
              PrimaryButton(
                label: 'Open MoMo Dialer',
                icon: Icons.phone_android,
                onPressed: () async {
                   final service = ref.read(contributionServiceProvider);
                   await service.launchMoMoUssd(amount);
                },
              ),
              const SizedBox(height: AppSpacing.md),
               TextButton(
                 onPressed: () {
                    Navigator.pop(context); // Close sheet
                    _navigateToProof(amount);
                 },
                 child: const Text('I have completed payment'),
               ),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        );
      },
    );
  }

  void _navigateToProof(int amount) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProofUploadScreen(
          groupId: widget.groupId,
          groupName: widget.groupName,
          amount: amount,
        ),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Contribute')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Contribute to ${widget.groupName}', style: AppTypography.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            const Text(
              'Max limit: 4,000 RWF / transaction',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            AppTextField(
              controller: _amountController,
              label: 'Amount (RWF)',
              hint: '0',
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              keyboardType: TextInputType.number,
              suffixIcon: const Padding(
                padding: EdgeInsets.all(12),
                child: Text('RWF', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            Wrap(
              spacing: AppSpacing.sm,
              children: [500, 1000, 2000, 4000].map((amount) {
                return ActionChip(
                  label: Text('$amount'),
                  backgroundColor: AppColors.surface,
                  onPressed: () {
                    _amountController.text = amount.toString();
                  },
                );
              }).toList(),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            const InfoCard(
               title: 'Important',
               subtitle: 'You will be redirected to your phone dialer. Payment happens via MoMo USSD, not inside the app.',
               leading: Icon(Icons.info_outline_rounded, color: AppColors.warning),
               backgroundColor:  Color(0xFFFFF8E1), // Light Warning
               borderColor: Colors.transparent,
            ),

            const SizedBox(height: AppSpacing.xxl),
            
            PrimaryButton(
               label: 'Proceed to Payment',
               isLoading: _isLoading,
               onPressed: _handleContribution,
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
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
  }

  void _showUSSDInstructions(int amount) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Complete Payment',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              Text(
                '1. Dial the USSD code below\n2. Approve payment of $amount RWF\n3. Return here to upload proof',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Text(
                      '*182*1*1*$amount#',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tap to dial',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final service = ref.read(contributionServiceProvider);
                        await service.launchMoMoUssd(amount);
                      },
                      child: const Text('Open Dialer'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context); // Close sheet
                        _navigateToProof(amount);
                      },
                      child: const Text('I have Paid'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contribute'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Contribute to ${widget.groupName}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Maximum contribution: 4,000 RWF per transaction',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 32),
              Text(
                'Amount (RWF)',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                decoration: InputDecoration(
                  hintText: '0',
                  prefixText: 'RWF ',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                children: [500, 1000, 2000, 4000].map((amount) {
                  return ActionChip(
                    label: Text('$amount'),
                    onPressed: () {
                      _amountController.text = amount.toString();
                    },
                  );
                }).toList(),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppColors.warning),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'You will be redirected to MoMo USSD. After payment, return to upload proof.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.warning,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleContribution,
                  icon: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.phone_android),
                  label: const Text('Pay via MoMo USSD'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

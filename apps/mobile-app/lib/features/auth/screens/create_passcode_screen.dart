import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';

class CreatePasscodeScreen extends ConsumerStatefulWidget {
  const CreatePasscodeScreen({super.key});

  @override
  ConsumerState<CreatePasscodeScreen> createState() =>
      _CreatePasscodeScreenState();
}

class _CreatePasscodeScreenState extends ConsumerState<CreatePasscodeScreen> {
  final _passcodeController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isConfirming = false;
  String? _error;
  bool _biometricsAvailable = false;
  bool _biometricsEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    final available = await ref.read(canUseBiometricsProvider.future);
    setState(() => _biometricsAvailable = available);
  }

  void _onDigitEntered(String digit) {
    setState(() => _error = null);
    final controller = _isConfirming ? _confirmController : _passcodeController;

    if (controller.text.length < 4) {
      controller.text += digit;
      if (controller.text.length == 4) {
        if (_isConfirming) {
          _verifyAndSave();
        } else {
          setState(() => _isConfirming = true);
        }
      }
    }
  }

  void _onDelete() {
    final controller = _isConfirming ? _confirmController : _passcodeController;
    if (controller.text.isNotEmpty) {
      setState(() {
        controller.text = controller.text.substring(0, controller.text.length - 1);
        _error = null;
      });
    }
  }

  Future<void> _verifyAndSave() async {
    if (_passcodeController.text != _confirmController.text) {
      setState(() {
        _error = 'Passcodes do not match';
        _isConfirming = false;
        _passcodeController.clear();
        _confirmController.clear();
      });
      return;
    }

    try {
      final passcodeService = ref.read(passcodeServiceProvider);
      await passcodeService.createPasscode(_passcodeController.text);

      if (_biometricsEnabled && _biometricsAvailable) {
        await passcodeService.setBiometricEnabled(true);
      }

      ref.read(refreshPasscodeProvider)(); // Invalidate providers

      if (mounted) {
         // Navigation is handled by RouterNotifier
      }
    } catch (e) {
      setState(() => _error = e.toString()); // Show validation error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 48),
            Text(
              _isConfirming ? 'Confirm Passcode' : 'Create Passcode',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              _isConfirming
                  ? 'Re-enter your 4-digit passcode'
                  : 'Enter a secure 4-digit passcode',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 48),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final code =
                    _isConfirming ? _confirmController.text : _passcodeController.text;
                final filled = index < code.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: filled ? AppColors.primary : AppColors.surface,
                    border: Border.all(
                      color: filled ? AppColors.primary : AppColors.textSecondary,
                      width: 2,
                    ),
                  ),
                );
              }),
            ),
            if (_error != null) ...[
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
            const Spacer(),
            if (!_isConfirming && _biometricsAvailable)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: SwitchListTile(
                  title: const Text('Enable Biometrics'),
                  value: _biometricsEnabled,
                  activeThumbColor: AppColors.primary,
                  onChanged: (value) => setState(() => _biometricsEnabled = value),
                ),
              ),
            _NumberPad(
              onDigit: _onDigitEntered,
              onDelete: _onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _NumberPad extends StatelessWidget {
  final Function(String) onDigit;
  final VoidCallback onDelete;

  const _NumberPad({required this.onDigit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 32),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['1', '2', '3'].map(_buildButton).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['4', '5', '6'].map(_buildButton).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['7', '8', '9'].map(_buildButton).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(width: 64, height: 64),
              _buildButton('0'),
              _buildDeleteButton(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildButton(String text) {
    return SizedBox(
      width: 64,
      height: 64,
      child: TextButton(
        onPressed: () => onDigit(text),
        style: TextButton.styleFrom(
          shape: const CircleBorder(),
          backgroundColor: AppColors.surface,
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildDeleteButton() {
    return SizedBox(
      width: 64,
      height: 64,
      child: IconButton(
        onPressed: onDelete,
        icon: const Icon(Icons.backspace_outlined),
        color: AppColors.textSecondary,
      ),
    );
  }
}

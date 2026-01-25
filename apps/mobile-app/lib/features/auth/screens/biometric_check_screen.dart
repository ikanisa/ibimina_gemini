import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';
import 'package:ibimina_mobile/features/dashboard/screens/dashboard_screen.dart';

class BiometricCheckScreen extends ConsumerStatefulWidget {
  const BiometricCheckScreen({super.key});

  @override
  ConsumerState<BiometricCheckScreen> createState() =>
      _BiometricCheckScreenState();
}

class _BiometricCheckScreenState extends ConsumerState<BiometricCheckScreen> {
  final _passcodeController = TextEditingController();
  bool _biometricsEnabled = false;
  String? _error;
  bool _isChecking = false;

  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    // If no passcode set, go to dashboard (this screen shouldn't be shown, but safeguard)
    final hasPasscode = await ref.read(hasPasscodeProvider.future);
    if (!hasPasscode) {
       _navigateToDashboard();
       return;
    }

    // Check biometrics
    final bioEnabled = await ref.read(isBiometricEnabledProvider.future);
    setState(() => _biometricsEnabled = bioEnabled);

    if (bioEnabled) {
      _authenticateBiometrics();
    }
  }

  Future<void> _authenticateBiometrics() async {
    if (_isChecking) return;
    setState(() => _isChecking = true);

    final passcodeService = ref.read(passcodeServiceProvider);
    final authenticated = await passcodeService.authenticateWithBiometrics();

    if (authenticated && mounted) {
      _navigateToDashboard();
    } else {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  Future<void> _verifyPasscode() async {
    if (_passcodeController.text.length != 4) return;
    setState(() => _isChecking = true);

    try {
      final valid = await ref
          .read(passcodeServiceProvider)
          .verifyPasscode(_passcodeController.text);
      
      if (valid && mounted) {
        _navigateToDashboard();
      } else {
        setState(() {
          _error = 'Incorrect passcode';
          _passcodeController.clear();
          _isChecking = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isChecking = false;
        _passcodeController.clear();
      });
    }
  }

  void _navigateToDashboard() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const DashboardScreen()),
    );
  }

  void _onDigitEntered(String digit) {
    setState(() => _error = null);
    if (_passcodeController.text.length < 4) {
      setState(() {
        _passcodeController.text += digit;
      });
      if (_passcodeController.text.length == 4) {
        _verifyPasscode();
      }
    }
  }

  void _onDelete() {
    if (_passcodeController.text.isNotEmpty) {
      setState(() {
        _passcodeController.text = _passcodeController.text.substring(
          0,
          _passcodeController.text.length - 1,
        );
        _error = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 64),
            const Icon(Icons.lock_outline, size: 48, color: AppColors.primary),
            const SizedBox(height: 24),
            Text(
              'Enter Passcode',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final filled = index < _passcodeController.text.length;
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
            if (_biometricsEnabled)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: TextButton.icon(
                  onPressed: _isChecking ? null : _authenticateBiometrics,
                  icon: const Icon(Icons.fingerprint, size: 32),
                  label: const Text('Use Biometrics'),
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

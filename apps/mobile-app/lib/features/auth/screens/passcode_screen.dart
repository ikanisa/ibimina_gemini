import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/ui.dart';

import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';

class PasscodeScreen extends ConsumerStatefulWidget {
  final bool isSetup;
  
  const PasscodeScreen({super.key, this.isSetup = false});

  @override
  ConsumerState<PasscodeScreen> createState() => _PasscodeScreenState();
}

class _PasscodeScreenState extends ConsumerState<PasscodeScreen> {
  final _controller = TextEditingController();
  String? _error;

  // For setup flow confirms
  String? _firstEntry;

  @override
  void initState() {
    super.initState();
    if (!widget.isSetup) {
      _checkBiometrics();
    }
  }

  Future<void> _checkBiometrics() async {
    // Small delay to let screen build
    await Future.delayed(const Duration(milliseconds: 300));
    final canAuth = await ref.read(passcodeServiceProvider).authenticateWithBiometrics();
    if (canAuth) {
      ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
      if (mounted) context.go('/home');
    }
  }

  Future<void> _submit() async {
    final code = _controller.text;
    if (code.length != 4) {
      setState(() => _error = 'Enter 4 digits');
      return;
    }

    if (widget.isSetup) {
      if (_firstEntry == null) {
        // First entry done, ask for confirm
        setState(() {
          _firstEntry = code;
          _controller.clear();
          _error = null;
        });
      } else {
        // Confirm check
        if (code != _firstEntry) {
          setState(() {
            _error = 'Passcodes do not match. Try again.';
            _firstEntry = null;
            _controller.clear();
          });
          return;
        }
        // Success setup
        await ref.read(passcodeServiceProvider).createPasscode(code);
        
        // Mark session as unlocked
        ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
        
        // Navigate Home
        if (mounted) context.go('/home'); 
      }
    } else {
      // Verify mode
      bool valid = await ref.read(passcodeServiceProvider).verifyPasscode(code);
      if (valid) {
        // Mark session as unlocked
        ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
        
        if (mounted) context.go('/home');
      } else {
        setState(() => _error = 'Incorrect passcode');
        _controller.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    String title = widget.isSetup
        ? (_firstEntry == null ? 'Create Passcode' : 'Confirm Passcode')
        : 'Enter Passcode';

    return AppScaffold(
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_outline, size: 48, color: AppColors.primary),
            const SizedBox(height: AppSpacing.lg),
            Text(title, style: AppTypography.titleLarge),
            const SizedBox(height: AppSpacing.xl),
            
            // Simple visualizer for now, replace with proper pin fields later
            AppTextField(
              controller: _controller,
              label: 'Passcode',
              hint: '****',
              keyboardType: TextInputType.number,
              obscureText: true,
              errorText: _error,
              onChanged: (val) {
                if (val.length == 4) _submit();
              },
            ),
          ],
        ),
      ),
    );
  }
}

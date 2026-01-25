import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';
import 'package:ibimina_mobile/features/auth/services/passcode_service.dart';

/// App lock screen - passcode gate on app start/resume.
class AppLockScreen extends ConsumerStatefulWidget {
  final Widget child;

  const AppLockScreen({super.key, required this.child});

  @override
  ConsumerState<AppLockScreen> createState() => _AppLockScreenState();
}

class _AppLockScreenState extends ConsumerState<AppLockScreen>
    with WidgetsBindingObserver {
  final _passcodeController = TextEditingController();
  
  bool _isLocked = true;
  bool _isLoading = false;
  String? _error;
  int _lockoutSeconds = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _attemptBiometricUnlock();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _passcodeController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Re-lock app when resumed from background
      setState(() => _isLocked = true);
      _attemptBiometricUnlock();
    }
  }

  Future<void> _attemptBiometricUnlock() async {
    final passcodeService = ref.read(passcodeServiceProvider);
    
    // Check if biometrics is enabled
    final biometricEnabled = await passcodeService.isBiometricEnabled();
    if (!biometricEnabled) return;

    final authenticated = await passcodeService.authenticateWithBiometrics();
    if (authenticated && mounted) {
      setState(() => _isLocked = false);
    }
  }

  Future<void> _verifyPasscode() async {
    if (_passcodeController.text.length < 4) {
      setState(() => _error = 'Enter your passcode');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final passcodeService = ref.read(passcodeServiceProvider);
      final isValid = await passcodeService.verifyPasscode(_passcodeController.text);

      if (isValid) {
        setState(() => _isLocked = false);
      } else {
        setState(() {
          _error = 'Incorrect passcode';
          _passcodeController.clear();
        });
      }
    } on PasscodeLockedException catch (e) {
      _lockoutSeconds = e.remainingSeconds;
      setState(() {
        _error = 'Too many attempts. Try again in ${_lockoutSeconds}s';
        _passcodeController.clear();
      });
    } catch (e) {
      setState(() {
        _error = 'Verification failed';
        _passcodeController.clear();
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLocked) {
      return widget.child;
    }

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Lock icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock_outline,
                  size: 40,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Ibimina',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your passcode to unlock',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
              ),
              const SizedBox(height: 48),
              // Passcode input
              SizedBox(
                width: 200,
                child: TextField(
                  controller: _passcodeController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  obscureText: true,
                  textAlign: TextAlign.center,
                  autofocus: true,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        letterSpacing: 12,
                        fontWeight: FontWeight.bold,
                      ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '••••',
                    filled: true,
                    fillColor: AppColors.darkSurface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (value) {
                    if (value.length == 4) {
                      _verifyPasscode();
                    }
                  },
                ),
              ),
              // Error message
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error),
                ),
              ],
              // Loading indicator
              if (_isLoading) ...[
                const SizedBox(height: 24),
                const CircularProgressIndicator(),
              ],
              const SizedBox(height: 32),
              // Biometrics button
              ref.watch(isBiometricEnabledProvider).when(
                data: (enabled) {
                  if (!enabled) return const SizedBox.shrink();
                  return TextButton.icon(
                    onPressed: _attemptBiometricUnlock,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Use Biometrics'),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

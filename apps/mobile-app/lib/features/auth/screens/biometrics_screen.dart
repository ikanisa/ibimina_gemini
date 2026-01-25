import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';
import 'package:ibimina_mobile/features/auth/screens/profile_completion_screen.dart';

/// Biometrics setup screen - optional step to enable fingerprint/face unlock.
class BiometricsScreen extends ConsumerStatefulWidget {
  const BiometricsScreen({super.key});

  @override
  ConsumerState<BiometricsScreen> createState() => _BiometricsScreenState();
}

class _BiometricsScreenState extends ConsumerState<BiometricsScreen> {
  bool _isLoading = false;

  Future<void> _enableBiometrics() async {
    setState(() => _isLoading = true);

    try {
      final passcodeService = ref.read(passcodeServiceProvider);
      
      // Test biometrics first
      final authenticated = await passcodeService.authenticateWithBiometrics();
      
      if (authenticated) {
        await passcodeService.setBiometricEnabled(true);
        ref.read(refreshPasscodeProvider)();
      }

      if (mounted) {
        _navigateToProfile();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to enable biometrics')),
        );
        _navigateToProfile();
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _skipBiometrics() {
    _navigateToProfile();
  }

  void _navigateToProfile() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const ProfileCompletionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canUseBiometrics = ref.watch(canUseBiometricsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quick Unlock'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: _skipBiometrics,
            child: const Text('Skip'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 32),
              // Biometrics icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.fingerprint,
                  size: 40,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Enable Quick Unlock',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Use fingerprint or face recognition to unlock the app quickly',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              // Check biometrics availability
              canUseBiometrics.when(
                data: (canUse) {
                  if (!canUse) {
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            color: AppColors.warning,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Biometrics not available on this device',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.warning,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
                loading: () => const CircularProgressIndicator(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),
              // Enable button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _enableBiometrics,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.fingerprint),
                  label: const Text('Enable Biometrics'),
                ),
              ),
              const SizedBox(height: 12),
              // Skip button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _skipBiometrics,
                  child: const Text('Maybe Later'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

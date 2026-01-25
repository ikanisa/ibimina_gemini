import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/screens/email_auth_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/login_screen.dart';
import 'package:ibimina_mobile/features/auth/screens/create_passcode_screen.dart';

/// Auth method chooser screen - Phone / Email / Google.
class AuthMethodScreen extends ConsumerStatefulWidget {
  const AuthMethodScreen({super.key});

  @override
  ConsumerState<AuthMethodScreen> createState() => _AuthMethodScreenState();
}

class _AuthMethodScreenState extends ConsumerState<AuthMethodScreen> {
  bool _isGoogleLoading = false;

  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      final response = await authService.signInWithGoogle();

      if (response != null && mounted) {
        // Google sign-in successful, navigate to passcode setup
        // Google sign-in successful, RouterNotifier will handle redirection
        // Navigator.pushAndRemoveUntil(
        //   context,
        //   MaterialPageRoute(builder: (_) => const CreatePasscodeScreen()),
        //   (route) => false,
        // );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google sign-in failed: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Choose how to continue',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Select your preferred sign-in method',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
              ),
              const SizedBox(height: 32),
              // Phone option
              _AuthMethodTile(
                icon: Icons.phone_android,
                title: 'Phone Number',
                subtitle: 'Sign in with SMS verification',
                onTap: () => context.push('/auth/login'),
              ),
              const SizedBox(height: 16),
              // Email option
              _AuthMethodTile(
                icon: Icons.email_outlined,
                title: 'Email',
                subtitle: 'Sign in with email and password',
                onTap: () => context.push('/auth/email'),
              ),
              const SizedBox(height: 16),
              // Google option
              _AuthMethodTile(
                icon: Icons.g_mobiledata_rounded,
                title: 'Google',
                subtitle: 'Continue with your Google account',
                isLoading: _isGoogleLoading,
                onTap: _isGoogleLoading ? null : _signInWithGoogle,
              ),
              const Spacer(),
              // Info text
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline,
                      color: AppColors.info,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Your data is encrypted and secure. We never share your information.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.darkTextSecondary,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthMethodTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final bool isLoading;

  const _AuthMethodTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.darkSurface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.darkTextSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              if (isLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                const Icon(
                  Icons.chevron_right,
                  color: AppColors.darkTextHint,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

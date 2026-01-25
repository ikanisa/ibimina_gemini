import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';

/// Welcome screen - entry point of the app.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),
              // App logo/icon
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.groups_3_rounded,
                  size: 64,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 32),
              // Title
              Text(
                'Ibimina',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
              ),
              const SizedBox(height: 12),
              // Tagline
              Text(
                'Save together, grow together',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Group micro-savings for Rwanda',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.darkTextHint,
                    ),
                textAlign: TextAlign.center,
              ),
              const Spacer(flex: 2),
              // Key features
              _FeatureRow(
                icon: Icons.people_outline,
                text: 'Join a savings group',
              ),
              const SizedBox(height: 12),
              _FeatureRow(
                icon: Icons.phone_android_outlined,
                text: 'Contribute via MoMo USSD',
              ),
              const SizedBox(height: 12),
              _FeatureRow(
                icon: Icons.trending_up_outlined,
                text: 'Track your progress',
              ),
              const Spacer(),
              // Get started button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _navigateToAuth(context),
                  child: const Text('Get Started'),
                ),
              ),
              const SizedBox(height: 16),
              // Terms
              Text(
                'By continuing, you agree to our Terms of Service',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.darkTextHint,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToAuth(BuildContext context) {
    context.go('/auth/method');
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeatureRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 16),
        Text(
          text,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ],
    );
  }
}

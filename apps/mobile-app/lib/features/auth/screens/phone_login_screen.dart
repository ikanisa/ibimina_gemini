import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';

class PhoneLoginScreen extends ConsumerStatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  ConsumerState<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends ConsumerState<PhoneLoginScreen> {
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      setState(() => _error = 'Please enter a phone number');
      return;
    }

    // Basic Rwanda validation
    if (!phone.startsWith('+250') || phone.length != 13) {
      setState(() => _error = 'Use format +250 7XX XXX XXX');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Trigger OTP send via provider
      await ref.read(authControllerProvider.notifier).sendOtp(phone);
      
        if (mounted) {
          await context.push('/auth/otp', extra: phone);
        }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(
              title: 'Enter your\nphone number',
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'We will send you a verification code.',
              style: AppTypography.bodyLarge.copyWith(color: AppColors.lightTextSecondary), // Using light for consistency, fix later if dark mode issue
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              controller: _phoneController,
              label: 'Phone Number',
              hint: '+250 788 123 456',
              keyboardType: TextInputType.phone,
              errorText: _error,
              onChanged: (_) => setState(() => _error = null),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Send Code',
              isLoading: _isLoading,
              onPressed: _sendOtp,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

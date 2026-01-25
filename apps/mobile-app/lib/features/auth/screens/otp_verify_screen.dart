import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';

class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String phone;

  const OtpVerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() => _error = 'Enter 6-digit code');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
            phone: widget.phone,
            otp: otp,
          );
      // On success, provider/router logic should redirect, or we force it here:
      if (mounted) {
        // Basic routing logic usually handled by router redirect stream, 
        // but for now we push to passcode or profile if router doesn't auto-handle.
        // Assuming app_router will handle auth state changes.
      }
    } catch (e) {
      setState(() => _error = 'Invalid code. Try "123456" for demo.');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SectionHeader(title: 'Enter\nVerification Code'),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Sent to ${widget.phone}',
              style: AppTypography.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              controller: _otpController,
              label: '6-digit Code',
              hint: '123456',
              keyboardType: TextInputType.number,
              errorText: _error,
              onChanged: (_) => setState(() => _error = null),
            ),
            const SizedBox(height: AppSpacing.lg),
            PrimaryButton(
              label: 'Verify',
              isLoading: _isLoading,
              onPressed: _verify,
            ),
          ],
        ),
      ),
    );
  }
}

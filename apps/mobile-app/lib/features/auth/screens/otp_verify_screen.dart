import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/config/app_config.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';

/// Test credentials for development mode
const String _testPhoneNumber = '+250788767816';
const String _testOtpCode = '123456';

class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String phone;

  const OtpVerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen>
    with SingleTickerProviderStateMixin {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  
  bool _isLoading = false;
  String? _error;
  late AnimationController _iconAnimController;
  late Animation<double> _iconAnimation;

  /// Check if running in dev mode
  bool get _isDevMode => AppConfig.instance.flavor == AppFlavor.dev;

  @override
  void initState() {
    super.initState();
    _iconAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _iconAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _iconAnimController, curve: Curves.easeOutBack),
    );
    _iconAnimController.forward();

    // Auto-fill test OTP in dev mode
    if (_isDevMode && widget.phone == _testPhoneNumber) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _autoFillTestOtp();
      });
    }
  }

  void _autoFillTestOtp() {
    for (int i = 0; i < 6 && i < _testOtpCode.length; i++) {
      _controllers[i].text = _testOtpCode[i];
    }
  }

  @override
  void dispose() {
    _iconAnimController.dispose();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _otp => _controllers.map((c) => c.text).join();

  void _onDigitChanged(int index, String value) {
    setState(() => _error = null);
    
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    
    // Auto-verify when all 6 digits entered
    if (_otp.length == 6) {
      _verify();
    }
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        _focusNodes[index - 1].requestFocus();
        _controllers[index - 1].clear();
      }
    }
  }

  Future<void> _verify() async {
    final otp = _otp;
    if (otp.length != 6) {
      setState(() => _error = 'Please enter all 6 digits');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // DEV MODE: Bypass Supabase for test credentials
      print('[OTP] _isDevMode: $_isDevMode');
      print('[OTP] widget.phone: ${widget.phone}');
      print('[OTP] _testPhoneNumber: $_testPhoneNumber');
      print('[OTP] otp: $otp');
      print('[OTP] _testOtpCode: $_testOtpCode');
      print('[OTP] phone matches: ${widget.phone == _testPhoneNumber}');
      print('[OTP] otp matches: ${otp == _testOtpCode}');
      
      if (_isDevMode && 
          widget.phone == _testPhoneNumber && 
          otp == _testOtpCode) {
        print('[OTP] ✅ DEV MODE BYPASS - Setting auth override to TRUE');
        // Set dev mode auth override - CRITICAL for router to allow navigation
        ref.read(devModeAuthOverrideProvider.notifier).setAuthenticated(true);
        
        // Verify it was set
        final isNowAuth = ref.read(isAuthenticatedProvider);
        print('[OTP] ✅ isAuthenticatedProvider now: $isNowAuth');
        
        // Simulate successful verification in dev mode
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          print('[OTP] ✅ Navigating to /auth/passcode');
          // Navigate to passcode SETUP screen for new users
          context.go('/auth/passcode', extra: {'isSetup': true});
        }
        return;
      }

      // PRODUCTION: Call real Supabase verification
      await ref.read(authControllerProvider.notifier).verifyOtp(
            phone: widget.phone,
            otp: otp,
          );
      
      // On success, navigate to passcode SETUP screen for new users
      if (mounted) {
        context.go('/auth/passcode', extra: {'isSetup': true});
      }
    } catch (e) {
      setState(() {
        if (_isDevMode) {
          _error = 'Invalid code. Use test OTP: $_testOtpCode';
        } else {
          _error = 'Invalid verification code';
        }
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _resendCode() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authControllerProvider.notifier).sendOtp(widget.phone);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Verification code sent'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Failed to resend code');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Back button
                      Align(
                        alignment: Alignment.centerLeft,
                        child: IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: Icon(
                            Icons.arrow_back_ios_new_rounded,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: AppSpacing.lg),
                      
                      // ─────────────────────────────────────────────
                      // ANIMATED ICON
                      // ─────────────────────────────────────────────
                      _buildAnimatedIcon(isDark),
                      
                      const SizedBox(height: AppSpacing.xl),
                      
                      // ─────────────────────────────────────────────
                      // TITLE & SUBTITLE
                      // ─────────────────────────────────────────────
                      Text(
                        'Verification Code',
                        style: AppTypography.headlineMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'We sent a 6-digit code to',
                        style: AppTypography.bodyMedium.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        _formatPhoneForDisplay(widget.phone),
                        style: AppTypography.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      
                      const SizedBox(height: AppSpacing.xxl),
                      
                      // ─────────────────────────────────────────────
                      // OTP INPUT BOXES
                      // ─────────────────────────────────────────────
                      _buildOtpInputRow(isDark),
                      
                      // Error message
                      if (_error != null) ...[
                        const SizedBox(height: AppSpacing.md),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.sm,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _error!,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.error,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: AppSpacing.xl),
                      
                      // ─────────────────────────────────────────────
                      // VERIFY BUTTON
                      // ─────────────────────────────────────────────
                      _buildVerifyButton(isDark),
                      
                      const SizedBox(height: AppSpacing.lg),
                      
                      // ─────────────────────────────────────────────
                      // RESEND CODE
                      // ─────────────────────────────────────────────
                      _buildResendSection(isDark),
                      
                      const Spacer(),
                      
                      // ─────────────────────────────────────────────
                      // DEV MODE HINT
                      // ─────────────────────────────────────────────
                      if (_isDevMode) ...[
                        _buildDevModeHint(isDark),
                        const SizedBox(height: AppSpacing.md),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAnimatedIcon(bool isDark) {
    return Center(
      child: AnimatedBuilder(
        animation: _iconAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _iconAnimation.value,
            child: child,
          );
        },
        child: Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withValues(alpha: 0.2),
                AppColors.primaryLight.withValues(alpha: 0.1),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.15),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: const Icon(
            Icons.verified_user_rounded,
            size: 48,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildOtpInputRow(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (index) {
        final hasValue = _controllers[index].text.isNotEmpty;
        
        return Container(
          width: 48,
          height: 56,
          margin: EdgeInsets.only(
            left: index == 0 ? 0 : 8,
          ),
          child: KeyboardListener(
            focusNode: FocusNode(),
            onKeyEvent: (event) => _onKeyEvent(index, event),
            child: TextField(
              controller: _controllers[index],
              focusNode: _focusNodes[index],
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              style: AppTypography.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: hasValue
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : (isDark ? AppColors.darkSurface : Colors.grey.shade50),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: hasValue
                        ? AppColors.primary
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: hasValue
                        ? AppColors.primary
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    width: hasValue ? 2 : 1,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: AppColors.primary,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              onChanged: (value) => _onDigitChanged(index, value),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildVerifyButton(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _isLoading ? null : _verify,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Text(
                'Verify Code',
                style: AppTypography.bodyLarge.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  Widget _buildResendSection(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Didn't receive the code?",
          style: AppTypography.bodySmall.copyWith(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
        TextButton(
          onPressed: _isLoading ? null : _resendCode,
          child: Text(
            'Resend',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDevModeHint(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.warning.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.developer_mode_rounded,
            color: AppColors.warning,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DEV MODE',
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.warning,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Test: $_testPhoneNumber | OTP: $_testOtpCode',
                  style: AppTypography.bodySmall.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatPhoneForDisplay(String phone) {
    // Format as +250 *** *** 816 (partial masking for privacy)
    if (phone.length >= 10) {
      final last3 = phone.substring(phone.length - 3);
      final prefix = phone.substring(0, 4);
      return '$prefix *** *** $last3';
    }
    return phone;
  }
}

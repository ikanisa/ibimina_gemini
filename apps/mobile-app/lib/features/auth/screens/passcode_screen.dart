import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/config/app_config.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/auth/providers/passcode_providers.dart';

/// Test passcode for development mode (non-sequential to pass weak-check)
const String _testPasscode = '1379';

class PasscodeScreen extends ConsumerStatefulWidget {
  final bool isSetup;
  
  const PasscodeScreen({super.key, this.isSetup = false});

  @override
  ConsumerState<PasscodeScreen> createState() => _PasscodeScreenState();
}

class _PasscodeScreenState extends ConsumerState<PasscodeScreen>
    with SingleTickerProviderStateMixin {
  final List<TextEditingController> _controllers = List.generate(
    4,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  
  bool _isLoading = false;
  String? _error;
  String? _firstEntry; // For setup confirmation
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

    // For returning users, try biometric auth
    if (!widget.isSetup) {
      _checkBiometrics();
    }
  }

  Future<void> _checkBiometrics() async {
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      final canAuth = await ref.read(passcodeServiceProvider).authenticateWithBiometrics();
      if (canAuth) {
        ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
        if (mounted) context.go('/home');
      }
    } catch (e) {
      // Biometrics failed, continue with passcode
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

  String get _passcode => _controllers.map((c) => c.text).join();

  void _clearDigits() {
    for (final c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  void _onDigitChanged(int index, String value) {
    setState(() => _error = null);
    
    if (value.isNotEmpty && index < 3) {
      _focusNodes[index + 1].requestFocus();
    }
    
    // Auto-submit when all 4 digits entered
    if (_passcode.length == 4) {
      _submit();
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

  Future<void> _submit() async {
    final code = _passcode;
    if (code.length != 4) {
      setState(() => _error = 'Please enter all 4 digits');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (widget.isSetup) {
        await _handleSetup(code);
      } else {
        await _handleVerify(code);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleSetup(String code) async {
    if (_firstEntry == null) {
      // First entry - ask for confirmation
      setState(() {
        _firstEntry = code;
        _clearDigits();
      });
      return;
    }

    // Confirmation entry
    if (code != _firstEntry) {
      setState(() {
        _error = 'Passcodes do not match. Try again.';
        _firstEntry = null;
        _clearDigits();
      });
      return;
    }

    // Success - create passcode
    // DEV MODE: Allow test passcode to bypass storage
    if (_isDevMode && code == _testPasscode) {
      await Future.delayed(const Duration(milliseconds: 300));
    } else {
      try {
        await ref.read(passcodeServiceProvider).createPasscode(code);
      } on ArgumentError catch (e) {
        // Handle weak passcode rejection
        setState(() {
          _error = e.message.toString().contains('simple') 
              ? 'Passcode is too simple. Avoid sequences like 1234.'
              : 'Invalid passcode: ${e.message}';
          _firstEntry = null;
          _clearDigits();
        });
        return;
      }
    }
    
    ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
    
    if (mounted) {
      context.go('/home');
    }
  }

  Future<void> _handleVerify(String code) async {
    // DEV MODE: Accept test passcode
    if (_isDevMode && code == _testPasscode) {
      ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
      if (mounted) context.go('/home');
      return;
    }

    final valid = await ref.read(passcodeServiceProvider).verifyPasscode(code);
    if (valid) {
      ref.read(isSessionUnlockedProvider.notifier).setUnlocked(true);
      if (mounted) context.go('/home');
    } else {
      setState(() {
        if (_isDevMode) {
          _error = 'Invalid passcode. Use test: $_testPasscode';
        } else {
          _error = 'Incorrect passcode';
        }
        _clearDigits();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Dynamic title based on setup state
    String title;
    String subtitle;
    
    if (widget.isSetup) {
      if (_firstEntry == null) {
        title = 'Create Passcode';
        subtitle = 'Choose a 4-digit passcode to secure your account';
      } else {
        title = 'Confirm Passcode';
        subtitle = 'Re-enter your passcode to confirm';
      }
    } else {
      title = 'Welcome Back';
      subtitle = 'Enter your passcode to continue';
    }

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
                      const SizedBox(height: AppSpacing.xxl * 2),
                      
                      // ─────────────────────────────────────────────
                      // ANIMATED ICON
                      // ─────────────────────────────────────────────
                      _buildAnimatedIcon(isDark),
                      
                      const SizedBox(height: AppSpacing.xl),
                      
                      // ─────────────────────────────────────────────
                      // TITLE & SUBTITLE
                      // ─────────────────────────────────────────────
                      Text(
                        title,
                        style: AppTypography.headlineMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        subtitle,
                        style: AppTypography.bodyMedium.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      
                      const SizedBox(height: AppSpacing.xxl),
                      
                      // ─────────────────────────────────────────────
                      // PASSCODE INPUT BOXES
                      // ─────────────────────────────────────────────
                      _buildPasscodeInputRow(isDark),
                      
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
                      // CONTINUE BUTTON
                      // ─────────────────────────────────────────────
                      _buildContinueButton(isDark),
                      
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
          child: Icon(
            widget.isSetup ? Icons.lock_open_rounded : Icons.lock_rounded,
            size: 48,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildPasscodeInputRow(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (index) {
        final hasValue = _controllers[index].text.isNotEmpty;
        
        return Container(
          width: 60,
          height: 70,
          margin: EdgeInsets.only(
            left: index == 0 ? 0 : 16,
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
              obscureText: true,
              style: AppTypography.headlineMedium.copyWith(
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
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: hasValue
                        ? AppColors.primary
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: hasValue
                        ? AppColors.primary
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    width: hasValue ? 2 : 1,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(
                    color: AppColors.primary,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 18),
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

  Widget _buildContinueButton(bool isDark) {
    final buttonText = widget.isSetup
        ? (_firstEntry == null ? 'Continue' : 'Confirm')
        : 'Unlock';
        
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
        onPressed: _isLoading ? null : _submit,
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
                buttonText,
                style: AppTypography.bodyLarge.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
      ),
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
                  'Test passcode: $_testPasscode',
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
}

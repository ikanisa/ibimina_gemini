import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/profile_providers.dart';
import 'package:ibimina_mobile/features/auth/screens/membership_check_screen.dart';

/// Profile completion screen - collect full name, MoMo number, WhatsApp number.
class ProfileCompletionScreen extends ConsumerStatefulWidget {
  const ProfileCompletionScreen({super.key});

  @override
  ConsumerState<ProfileCompletionScreen> createState() =>
      _ProfileCompletionScreenState();
}

class _ProfileCompletionScreenState
    extends ConsumerState<ProfileCompletionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _momoController = TextEditingController();
  final _whatsappController = TextEditingController();

  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _fullNameController.dispose();
    _momoController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  String get _fullMomoNumber => '+250${_momoController.text}';
  String get _fullWhatsappNumber => '+250${_whatsappController.text}';

  String? _validatePhoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Required';
    }
    if (value.length != 9) {
      return 'Enter 9 digits';
    }
    if (!RegExp(r'^7[2389]\d{7}$').hasMatch(value)) {
      return 'Invalid Rwanda number';
    }
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final user = ref.read(currentUserProvider);
      if (user == null) throw Exception('Not authenticated');

      final profileService = ref.read(profileServiceProvider);
      
      await profileService.createProfile(
        userId: user.id,
        fullName: _fullNameController.text.trim(),
        momoNumber: _fullMomoNumber,
        whatsappNumber: _fullWhatsappNumber,
      );

      ref.read(refreshProfileProvider)();

      if (mounted) {
         // Navigation handled by RouterNotifier
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to save profile. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Your Profile'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Almost there!',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'We need a few details to set up your account',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.darkTextSecondary,
                      ),
                ),
                const SizedBox(height: 32),
                // Full name field
                TextFormField(
                  controller: _fullNameController,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Jean Baptiste Nkurunziza',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter your full name';
                    }
                    if (value.trim().split(' ').length < 2) {
                      return 'Enter first and last name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                // MoMo number field
                Text(
                  'MoMo Number',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  'This number will be used for contributions via USSD',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.darkTextSecondary,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.darkBorder),
                      ),
                      child: Text(
                        '+250',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _momoController,
                        keyboardType: TextInputType.phone,
                        maxLength: 9,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          hintText: '788 123 456',
                          counterText: '',
                          prefixIcon: const Icon(Icons.phone_android_outlined),
                        ),
                        validator: _validatePhoneNumber,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // WhatsApp number field
                Text(
                  'WhatsApp Number',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  'For group communications and updates',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.darkTextSecondary,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.darkBorder),
                      ),
                      child: Text(
                        '+250',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _whatsappController,
                        keyboardType: TextInputType.phone,
                        maxLength: 9,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          hintText: '788 123 456',
                          counterText: '',
                          prefixIcon: const Icon(Icons.chat_outlined),
                        ),
                        validator: _validatePhoneNumber,
                      ),
                    ),
                  ],
                ),
                // Error message
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: AppColors.error, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Continue'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

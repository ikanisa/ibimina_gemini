import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/ui/ui.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';
import 'package:ibimina_mobile/features/auth/providers/profile_providers.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _nameController = TextEditingController();
  final _momoController = TextEditingController();
  final _whatsappController = TextEditingController();
  
  bool _isLoading = false;
  String? _error;

  Future<void> _saveProfile() async {
    final name = _nameController.text.trim();
    final momo = _momoController.text.trim();
    
    if (name.isEmpty || momo.isEmpty) {
      setState(() => _error = 'Name and MoMo number are required');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final user = ref.read(currentUserProvider);
      if (user == null) throw Exception('User not authenticated');

      await ref.read(profileServiceProvider).createProfile(
        userId: user.id,
        fullName: name,
        momoNumber: momo,
        whatsappNumber: _whatsappController.text.trim().isNotEmpty 
            ? _whatsappController.text.trim() 
            : momo, // Default to MoMo if empty? Or required. 
                    // Plan says: "WhatsApp Number (Optional)" but logic usually requires it.
                    // Let's use momo as fallback or empty string? 
                    // Service signature says required. I'll use momo as default or empty string if allowed.
                    // Let's check service signature again: required String whatsappNumber.
      );

      // Refresh profile state
      ref.invalidate(currentProfileProvider);
      ref.invalidate(isProfileCompleteProvider);
      
      if (mounted) {
        // Proceed to Passcode Setup (since new user)
        context.go('/auth/passcode', extra: {'isSetup': true});
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(title: 'Complete your\nprofile'),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'We need a few details to set up your membership.',
              style: AppTypography.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.xl),
            
            AppTextField(
              controller: _nameController,
              label: 'Full Name',
              hint: 'Jean Bosco',
            ),
            const SizedBox(height: AppSpacing.md),
            
            AppTextField(
              controller: _momoController,
              label: 'MoMo Number',
              hint: '+250 788 ...',
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: AppSpacing.md),
            
            AppTextField(
              controller: _whatsappController,
              label: 'WhatsApp Number (Optional)',
              hint: '+250 788 ...',
              keyboardType: TextInputType.phone,
            ),
            
            const SizedBox(height: AppSpacing.xl),
            if (_error != null) ...[
               Text(_error!, style: AppTypography.bodySmall.copyWith(color: AppColors.error)),
               const SizedBox(height: AppSpacing.md),
            ],
            
            PrimaryButton(
              label: 'Continue',
              isLoading: _isLoading,
              onPressed: _saveProfile,
            ),
          ],
        ),
      ),
    );
  }
}

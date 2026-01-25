import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/auth/models/user_profile.dart';
import 'package:ibimina_mobile/features/auth/services/profile_service.dart';
import 'package:ibimina_mobile/features/auth/providers/auth_providers.dart';

/// Provider for ProfileService instance.
final profileServiceProvider = Provider((ref) => ProfileService());

/// Provider for current user's profile.
/// Returns null if not authenticated or no profile exists.
final currentProfileProvider = FutureProvider<UserProfile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final profileService = ref.watch(profileServiceProvider);
  return profileService.getProfile(user.id);
});

/// Provider to check if current user's profile is complete.
final isProfileCompleteProvider = FutureProvider<bool>((ref) async {
  final profile = await ref.watch(currentProfileProvider.future);
  return profile?.isComplete ?? false;
});

/// Provider to invalidate and refresh profile data.
final refreshProfileProvider = Provider((ref) {
  return () {
    ref.invalidate(currentProfileProvider);
    ref.invalidate(isProfileCompleteProvider);
  };
});

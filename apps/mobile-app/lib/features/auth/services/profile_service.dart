import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/auth/models/user_profile.dart';

/// Service for managing user profiles in Supabase.
class ProfileService {
  static const String _tableName = 'profiles';

  /// Get profile by user ID.
  Future<UserProfile?> getProfile(String userId) async {
    final response = await supabase
        .from(_tableName)
        .select()
        .eq('user_id', userId)
        .maybeSingle();

    if (response == null) return null;
    return UserProfile.fromJson(response);
  }

  /// Get profile by MoMo number.
  Future<UserProfile?> getProfileByMomo(String momoNumber) async {
    final response = await supabase
        .from(_tableName)
        .select()
        .eq('momo_number', momoNumber)
        .maybeSingle();

    if (response == null) return null;
    return UserProfile.fromJson(response);
  }

  /// Create a new profile.
  Future<UserProfile> createProfile({
    required String userId,
    required String fullName,
    required String momoNumber,
    required String whatsappNumber,
    String? district,
    String? sector,
  }) async {
    final response = await supabase
        .from(_tableName)
        .insert({
          'user_id': userId,
          'full_name': fullName,
          'momo_number': momoNumber,
          'whatsapp_number': whatsappNumber,
          'district': district,
          'sector': sector,
        })
        .select()
        .single();

    return UserProfile.fromJson(response);
  }

  /// Update an existing profile.
  Future<UserProfile> updateProfile(UserProfile profile) async {
    final response = await supabase
        .from(_tableName)
        .update({
          'full_name': profile.fullName,
          'momo_number': profile.momoNumber,
          'whatsapp_number': profile.whatsappNumber,
          'district': profile.district,
          'sector': profile.sector,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', profile.id)
        .select()
        .single();

    return UserProfile.fromJson(response);
  }

  /// Check if user has a complete profile.
  Future<bool> isProfileComplete(String userId) async {
    final profile = await getProfile(userId);
    return profile?.isComplete ?? false;
  }

  /// Update institution ID for the user.
  Future<void> updateInstitutionId(String userId, String institutionId) async {
    await supabase
        .from(_tableName)
        .update({'institution_id': institutionId})
        .eq('user_id', userId);
  }
}

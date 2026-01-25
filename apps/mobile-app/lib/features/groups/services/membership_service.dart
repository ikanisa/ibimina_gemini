import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/groups/models/membership.dart';

/// Service for looking up user group memberships.
class MembershipService {
  static const String _tableName = 'group_members';

  /// Look up membership by MoMo number.
  /// This is the primary lookup method after profile completion.
  Future<GroupMembership?> lookupByMomoNumber(String momoNumber) async {
    // First get the profile with this momo number
    final profileResponse = await supabase
        .from('profiles')
        .select('user_id')
        .eq('momo_number', momoNumber)
        .maybeSingle();

    if (profileResponse == null) return null;

    final userId = profileResponse['user_id'] as String;
    return lookupByUserId(userId);
  }

  /// Look up membership by user ID.
  Future<GroupMembership?> lookupByUserId(String userId) async {
    final response = await supabase
        .from(_tableName)
        .select('''
          *,
          group:groups(*)
        ''')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

    if (response == null) return null;
    return GroupMembership.fromJson(response);
  }

  /// Check if user has an active membership.
  Future<bool> hasMembership(String userId) async {
    final membership = await lookupByUserId(userId);
    return membership != null;
  }

  /// Get all memberships for a user (in case of future multi-group support).
  Future<List<GroupMembership>> getAllMemberships(String userId) async {
    final response = await supabase
        .from(_tableName)
        .select('''
          *,
          group:groups(*)
        ''')
        .eq('user_id', userId)
        .order('joined_at', ascending: false);

    return (response as List)
        .map((json) => GroupMembership.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}

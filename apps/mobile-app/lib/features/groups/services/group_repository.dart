import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/group_model.dart';
import '../models/membership.dart';

class GroupRepository {
  final SupabaseClient _supabase;

  GroupRepository({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client;

  Future<String?> getMyInstitutionId() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return null;
    
    try {
      final response = await _supabase
          .from('profiles')
          .select('institution_id')
          .eq('user_id', userId)
          .single();
      return response['institution_id'] as String?;
    } catch (e) {
      return null;
    }
  }
  
  Future<String?> _getMyMemberId(String institutionId) async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      try {
        final response = await _supabase
            .from('members')
            .select('id')
            .eq('user_id', userId)
            .single();
        return response['id'] as String;
      } catch (e) {
        return null;
      }
  }

  /// Creates a new group.
  Future<Group> createGroup({
    required String name,
    required String institutionId,
    String? description,
    GroupType type = GroupType.private,
    int contributionAmount = 0,
    String frequency = 'MONTHLY',
  }) async {
    // 1. Check if user already has an active membership anywhere
    final currentInstitutionId = await getMyInstitutionId();
    if (currentInstitutionId != null) {
      try {
        final existingMembership = await getMyMembership(currentInstitutionId);
         if (existingMembership.isActive) {
            throw Exception('You are already a member of a group (${existingMembership.group?.name ?? 'Unknown'}). You cannot create another.');
         }
      } catch (_) {
        // No active membership found for current institution, proceed.
      }
    }

    // 2. Determine status
    final status = type == GroupType.public ? 'PENDING_APPROVAL' : 'ACTIVE';
    final inviteCode = _generateInviteCode();

    final response = await _supabase.from('groups').insert({
      'group_name': name,
      'institution_id': institutionId,
      'description': description,
      'type': type.name.toUpperCase(),
      'invite_code': inviteCode,
      'status': status,
      'contribution_amount': contributionAmount,
      'frequency': frequency,
    }).select().single();

    final group = Group.fromJson(response);
    
    var memberId = await _getMyMemberId(institutionId);
    if (memberId == null) {
       final user = _supabase.auth.currentUser!;
       final memberRes = await _supabase.from('members').insert({
          'institution_id': institutionId,
          'user_id': user.id,
          'full_name': user.userMetadata?['full_name'] ?? user.email ?? 'User',
          'phone': user.phone ?? '',
          'status': 'ACTIVE',
       }).select().single();
       memberId = memberRes['id'] as String;
    }

    await _supabase.from('group_members').insert({
      'institution_id': institutionId,
      'group_id': group.id,
      'member_id': memberId,
      'role': 'CHAIR',
      'status': 'GOOD_STANDING',
    });

    return group;
  }

  /// Join a group via invite code.
  Future<GroupMembership> joinGroup(String inviteCode) async {
    // 0. Pre-flight check: User must not be in a group already
    final institutionId = await getMyInstitutionId();
    if (institutionId != null) {
       try {
         final existingMembership = await getMyMembership(institutionId);
         if (existingMembership.isActive) {
            throw Exception('You are already a member of a group (${existingMembership.group?.name ?? 'Unknown'}). You cannot join another.');
         }
       } catch (_) {
         // No active membership, safe to proceed
       }
    }

    final groupRes = await _supabase.from('groups').select('institution_id').eq('invite_code', inviteCode).maybeSingle();
    if (groupRes == null) throw Exception('Invalid invite code');
    final targetInstitutionId = groupRes['institution_id'] as String;
    
    // Safety check: if we somehow have an institution ID mismatch (shouldn't happen in single-auth context but good for safety)
    if (institutionId != null && institutionId != targetInstitutionId) {
       // This implies multi-tenancy complexity; for now, we assume user fits. 
       // But if they have a profile elsewhere, this might be tricky. 
       // For Ibimina MVP, we assume one profile per user per system effectively.
    }

    var memberId = await _getMyMemberId(targetInstitutionId);
    if (memberId == null) {
        final user = _supabase.auth.currentUser!;
        final memberRes = await _supabase.from('members').insert({
          'institution_id': targetInstitutionId,
          'user_id': user.id,
          'full_name': user.userMetadata?['full_name'] ?? user.email ?? 'User',
          'phone': user.phone ?? 'Unknown',
          'status': 'ACTIVE',
       }).select().single();
       memberId = memberRes['id'] as String;
    }

    final response = await _supabase.rpc('join_group_via_invite', params: {
      'p_invite_code': inviteCode,
      'p_member_id': memberId,
    });

    final data = response as Map<String, dynamic>;
    if (data['status'] == 'joined' || data['status'] == 'already_member') {
       return getMyMembership(targetInstitutionId);
    }
    
    throw Exception('Failed to join group: ${data['status']}');
  }

  /// Fetch the current user's active membership.
  Future<GroupMembership> getMyMembership(String institutionId) async {
    final memberId = await _getMyMemberId(institutionId);
    if (memberId == null) {
      throw Exception('User membership not found');
    }

    final response = await _supabase
        .from('group_members')
        .select('*, groups(*)')
        .eq('member_id', memberId)
        .inFilter('status', ['GOOD_STANDING', 'ACTIVE'])
        .maybeSingle();
    
    if (response == null) throw Exception('No active group membership');

    return GroupMembership.fromJson(response);
  }

  /// Search for public, approved groups.
  Future<List<Group>> searchPublicGroups(String query) async {
    var builder = _supabase
        .from('groups')
        .select()
        .eq('type', 'PUBLIC')
        .eq('status', 'APPROVED'); // Only approved groups

    if (query.isNotEmpty) {
      builder = builder.ilike('group_name', '%$query%');
    }

    final response = await builder.limit(20);
    return (response as List).map((e) => Group.fromJson(e)).toList();
  }

  /// Fetch members of a group.
  Future<List<GroupMembership>> getGroupMembers(String groupId) async {
    final response = await _supabase
        .from('group_members')
        .select('*, members(full_name, phone)') // Fetch member details
        .eq('group_id', groupId)
        .order('joined_date', ascending: false);

    // Note: GroupMembership.fromJson might need update if we want to include 'members' data.
    // Ideally we map it to a View model or update GroupMembership to hold Member details.
    // For now we just return membership list.
    return (response as List).map((e) => GroupMembership.fromJson(e)).toList();
  }

  /// Lookup membership by MoMo number.
  Future<GroupMembership?> lookupByMomoNumber(String momoNumber) async {
    try {
      final memberRes = await _supabase
          .from('members')
          .select('id')
          .eq('phone', momoNumber)
          .maybeSingle();
          
      if (memberRes == null) return null;
      
      final memberId = memberRes['id'] as String;
      
      final response = await _supabase
          .from('group_members')
          .select('*, groups(*)')
          .eq('member_id', memberId)
          .inFilter('status', ['GOOD_STANDING', 'ACTIVE'])
          .maybeSingle();
      
      if (response == null) return null;
      return GroupMembership.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  String _generateInviteCode() {
    return DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase().substring(0, 6);
  }

  /// Fetches a preview of the group using an invite token (opaque code/UUID).
  Future<Group> fetchGroupPreview(String inviteToken) async {
      // Use the secured RPC that validates expiry and doesn't require direct table access
      final response = await _supabase.rpc('get_invite_details', params: {
        'p_token': inviteToken,
      });

      final data = response as Map<String, dynamic>;
      
      if (data['valid'] != true) {
         throw Exception(data['error'] ?? 'Invalid invite token');
      }
      
      // Return a partial Group object with available info
      return Group(
        id: data['group_id'] as String,
        name: data['group_name'] as String,
        institutionId: '', // Not returned by RPC for privacy
        type: GroupType.private, // Assumed if using invite
        status: 'ACTIVE',
        frequency: 'MONTHLY', // Default/Unknown
        contributionAmount: 0, // Hidden
        // Map other fields as empty/default since they are private
      );
  }

  /// Join a group via invite token using the hardened Edge Function.
  Future<void> joinGroup(String inviteToken) async {
    // 0. Pre-flight check: User must not be in a group already
    // (This is also checked by the Edge Function, but good for UX)
    final institutionId = await getMyInstitutionId();
    if (institutionId != null) {
       try {
         final existingMembership = await getMyMembership(institutionId);
         if (existingMembership.isActive) {
            throw Exception('You are already a member of a group (${existingMembership.group?.name ?? 'Unknown'}). You cannot join another.');
         }
       } catch (_) {
         // No active membership, safe to proceed
       }
    }

    // Call Edge Function with Rate Limiting
    final response = await _supabase.functions.invoke('ibimina-join-group', body: {
      'token': inviteToken,
    });
    
    final data = response.data as Map<String, dynamic>;
    
    if (response.status != 200) {
       throw Exception(data['error'] ?? 'Failed to join group');
    }
  }

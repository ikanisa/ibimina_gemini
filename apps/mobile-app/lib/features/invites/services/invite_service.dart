import 'package:supabase_flutter/supabase_flutter.dart';

class InviteService {
  final SupabaseClient _client;

  InviteService(this._client);

  /// Helper to extract token from various input formats:
  /// - https://ibimina.app/join/ABC1234
  /// - ibimina://join/ABC1234
  /// - ABC1234
  static String? parseInviteCode(String input) {
    if (input.isEmpty) return null;
    final uri = Uri.tryParse(input);
    if (uri != null) {
        // Case 1: scheme://join/CODE (host is join)
        if (uri.host == 'join') {
           if (uri.pathSegments.isNotEmpty) {
               return uri.pathSegments.first;
           }
        }
        // Case 2: https://domain/join/CODE (join is path segment)
        if (uri.pathSegments.contains('join')) {
            final index = uri.pathSegments.indexOf('join');
            if (index + 1 < uri.pathSegments.length) {
               return uri.pathSegments[index + 1];
            }
        }
    }
    // Assume raw code if no scheme/host or simple string
    return input.trim();
  }

  /// Creates a new invite for the given [groupId] and returns the shareable URL.
  /// Default expiration is 24 hours.
  Future<String> createInvite(String groupId) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User must be logged in to create invites');

    final res = await _client.from('group_invites').insert({
      'group_id': groupId,
      'created_by': user.id,
      'expires_at': DateTime.now().add(const Duration(hours: 24)).toIso8601String(),
    }).select().single();

    final token = res['token'];
    // Using https scheme for universal links
    return 'https://ibimina.app/join/$token';
  }

  /// Validates an invite token and returns group details.
  /// Returns a Map with {valid, group_name, member_count, group_id, error}.
  Future<Map<String, dynamic>> validateInvite(String token) async {
    try {
      final res = await _client.rpc('get_invite_details', params: {'p_token': token});
      return Map<String, dynamic>.from(res);
    } catch (e) {
      // Handle RPC errors or network issues
      return {'valid': false, 'error': e.toString()};
    }
  }

  /// Accepts an invite token to join the group.
  /// Returns the RPC response (status, group_id, etc.)
  Future<Map<String, dynamic>> acceptInvite(String token) async {
    try {
      final res = await _client.rpc('accept_invite', params: {'p_token': token});
      return Map<String, dynamic>.from(res);
    } catch (e) {
      return {'status': 'error', 'message': e.toString()};
    }
  }
}

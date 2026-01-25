import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';

class GroupService {
  /// Fetches a list of groups the current user belongs to.
  Future<List<Group>> getUserGroups() async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await supabase
          .from('groups')
          .select('*, members!inner(user_id)')
          .eq('members.user_id', user.id);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => Group.fromJson(json)).toList();
    } catch (e) {
      // TODO: Better error handling
      rethrow;
    }
  }

  /// Fetches a single group by ID
  Future<Group?> getGroup(String groupId) async {
    try {
      final response = await supabase
          .from('groups')
          .select()
          .eq('id', groupId)
          .single();
      
      return Group.fromJson(response);
    } catch (e) {
      return null;
    }
  }
}

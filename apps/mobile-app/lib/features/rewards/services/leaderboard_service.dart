import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/rewards/models/leaderboard_entry.dart';

class LeaderboardService {
  Future<List<LeaderboardEntry>> getTopGroups() async {
    try {
      // Query the optimized SQL View instead of client-side aggregation
      final response = await supabase
          .from('view_leaderboard_monthly')
          .select()
          .limit(10); // Top 10

      final data = List<Map<String, dynamic>>.from(response);

      return data.map((row) {
        return LeaderboardEntry(
          rank: row['rank'] as int,
          name: row['group_name'] as String,
          score: (row['confirmed_total'] as num).toDouble(),
          trend: 'stable', // Placeholder, view could provide this later
        );
      }).toList();
    } catch (e) {
      // Return empty on error or log
      return [];
    }
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/rewards/models/leaderboard_entry.dart'; // Ensure this model is available
import 'package:ibimina_mobile/features/rewards/services/leaderboard_service.dart';

final leaderboardServiceProvider = Provider((ref) => LeaderboardService());

// Mock Data Provider for Leaderboard
// In a real app, this would fetch from a backend endpoint optimized for this query.
final leaderboardProvider = FutureProvider<List<LeaderboardEntry>>((ref) async {
  final service = ref.watch(leaderboardServiceProvider);
  return service.getTopGroups();
});

import 'package:flutter/material.dart';
import 'package:ibimina_mobile/features/rewards/models/leaderboard_entry.dart';

class LeaderboardWidget extends StatelessWidget {
  final List<LeaderboardEntry> entries;
  final bool isLoading;

  const LeaderboardWidget({
    super.key,
    required this.entries,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (entries.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        alignment: Alignment.center,
        child: Column(
          children: [
            Icon(Icons.emoji_events_outlined, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 10),
            Text(
              'No public groups ranked yet.',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            const Text(
              'Be the first to contribute!',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: entries.length,
      itemBuilder: (context, index) {
        final entry = entries[index];
        final rank = index + 1;
        
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: _getRankColor(rank),
            foregroundColor: Colors.white,
            child: Text('$rank'),
          ),
          title: Text(entry.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Rank #${entry.rank}'),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'RWF ${entry.score.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const Text(
                'total',
                style: TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFFFD700); // Gold
      case 2:
        return const Color(0xFFC0C0C0); // Silver
      case 3:
        return const Color(0xFFCD7F32); // Bronze
      default:
        return Colors.blueGrey;
    }
  }
}

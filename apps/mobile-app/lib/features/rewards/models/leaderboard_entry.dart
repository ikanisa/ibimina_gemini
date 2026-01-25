class LeaderboardEntry {
  final int rank;
  final String name;
  final double score;
  final String trend;

  const LeaderboardEntry({
    required this.rank,
    required this.name,
    required this.score,
    required this.trend,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] as int,
      name: json['name'] as String,
      score: (json['score'] as num).toDouble(),
      trend: json['trend'] as String,
    );
  }
}

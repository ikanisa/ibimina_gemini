enum GroupType { private, public }

class Group {
  final String id;
  final String name;
  final String? description;
  final String institutionId;
  final DateTime createdAt;
  final GroupType type;
  final String? inviteCode;
  final String status; // ACTIVE, INACTIVE, etc.
  final int contributionAmount;
  final String frequency; // WEEKLY, MONTHLY, FLEXIBLE

  Group({
    required this.id,
    required this.name,
    this.description,
    required this.institutionId,
    required this.createdAt,
    this.type = GroupType.private,
    this.inviteCode,
    this.status = 'ACTIVE',
    this.contributionAmount = 0,
    this.frequency = 'MONTHLY',
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as String,
      name: json['group_name'] ?? json['name'] as String,
      description: json['description'] as String?,
      institutionId: json['institution_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      type: _parseGroupType(json['type'] as String?),
      inviteCode: json['invite_code'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      contributionAmount: json['contribution_amount'] as int? ?? 0,
      frequency: json['frequency'] as String? ?? 'MONTHLY',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'group_name': name,
      'description': description,
      'institution_id': institutionId,
      'created_at': createdAt.toIso8601String(),
      'type': type.name.toUpperCase(),
      'invite_code': inviteCode,
      'status': status,
      'contribution_amount': contributionAmount,
      'frequency': frequency,
    };
  }

  static GroupType _parseGroupType(String? type) {
    if (type == null) return GroupType.private;
    return GroupType.values.firstWhere(
      (e) => e.name.toUpperCase() == type.toUpperCase(),
      orElse: () => GroupType.private,
    );
  }
}

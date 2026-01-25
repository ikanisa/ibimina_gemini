import 'package:ibimina_mobile/features/groups/models/group_model.dart';

/// Represents a user's membership in a group.
class GroupMembership {
  final String id;
  final String userId; 
  final String groupId;
  final Group? group;
  final String role; 
  final String status; 
  final String institutionId; // Added
  final DateTime joinedAt;
  
  // Expanded details from joins
  final String? memberName;
  final String? memberPhone;

  const GroupMembership({
    required this.id,
    required this.userId,
    required this.groupId,
    this.group,
    required this.role,
    required this.status,
    required this.institutionId,
    required this.joinedAt,
    this.memberName,
    this.memberPhone,
  });

  bool get isActive => ['GOOD_STANDING', 'ACTIVE'].contains(status.toUpperCase());
  bool get isAdmin => ['CHAIR', 'TREASURER', 'SECRETARY', 'ADMIN', 'OWNER'].contains(role.toUpperCase());

  factory GroupMembership.fromJson(Map<String, dynamic> json) {
    // Handle nested 'members' object from supabase select
    String? name;
    String? phone;
    
    if (json['members'] != null) {
      final m = json['members'] as Map<String, dynamic>;
      name = m['full_name'] as String?;
      phone = m['phone'] as String?;
    }

    return GroupMembership(
      id: json['id'] as String,
      userId: json['member_id'] as String,
      groupId: json['group_id'] as String,
      group: json['groups'] != null ? Group.fromJson(json['groups'] as Map<String, dynamic>) : null,
      role: json['role'] as String? ?? 'MEMBER',
      status: json['status'] as String? ?? 'GOOD_STANDING',
      institutionId: json['institution_id'] as String, // Added
      joinedAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
      memberName: name,
      memberPhone: phone,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_id': userId,
      'group_id': groupId,
      'role': role,
      'status': status,
      'institution_id': institutionId,
      'created_at': joinedAt.toIso8601String(),
    };
  }
}

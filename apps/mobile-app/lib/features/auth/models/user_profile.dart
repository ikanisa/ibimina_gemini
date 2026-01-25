/// User profile model for Ibimina.
///
/// Rwanda-specific: momo_number is the primary identity for membership lookup.
class UserProfile {
  final String id;
  final String userId;
  final String fullName;
  final String momoNumber;
  final String whatsappNumber;
  final String? district;
  final String? sector;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const UserProfile({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.momoNumber,
    required this.whatsappNumber,
    this.district,
    this.sector,
    required this.createdAt,
    this.updatedAt,
  });

  /// Check if profile has all required fields.
  bool get isComplete =>
      fullName.isNotEmpty &&
      momoNumber.isNotEmpty &&
      whatsappNumber.isNotEmpty;

  /// Create from Supabase JSON response.
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      fullName: json['full_name'] as String? ?? '',
      momoNumber: json['momo_number'] as String? ?? '',
      whatsappNumber: json['whatsapp_number'] as String? ?? '',
      district: json['district'] as String?,
      sector: json['sector'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  /// Convert to JSON for Supabase insert/update.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'momo_number': momoNumber,
      'whatsapp_number': whatsappNumber,
      'district': district,
      'sector': sector,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Create a copy with updated fields.
  UserProfile copyWith({
    String? id,
    String? userId,
    String? fullName,
    String? momoNumber,
    String? whatsappNumber,
    String? district,
    String? sector,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      fullName: fullName ?? this.fullName,
      momoNumber: momoNumber ?? this.momoNumber,
      whatsappNumber: whatsappNumber ?? this.whatsappNumber,
      district: district ?? this.district,
      sector: sector ?? this.sector,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() =>
      'UserProfile(userId: $userId, fullName: $fullName, momoNumber: ****)';
}

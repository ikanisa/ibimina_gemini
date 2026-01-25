class Transaction {
  final String id;
  final String type; // 'deposit', 'withdrawal' (if allowed later), etc.
  final double amount;
  final String currency;
  final String status; // 'pending', 'confirmed', 'rejected'
  final String? memberId;
  final String? groupId;
  final DateTime createdAt;

  final String? proofUrl;
  final String? transactionId;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.currency,
    required this.status,
    this.memberId,
    this.groupId,
    required this.createdAt,
    this.proofUrl,
    this.transactionId,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      type: json['type'] as String,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String,
      status: json['status'] as String,
      memberId: json['member_id'] as String?,
      groupId: json['group_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      proofUrl: json['proof_url'] as String?,
      transactionId: json['transaction_id'] as String?,
    );
  }
}

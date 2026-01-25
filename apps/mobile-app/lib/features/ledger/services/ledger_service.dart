import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LedgerService {
  final SupabaseClient _client;

  LedgerService([SupabaseClient? client]) : _client = client ?? supabase;

  /// Fetches transactions for a specific group.
  Future<List<Transaction>> getGroupTransactions(String groupId) async {
    try {
      final response = await _client
          .from('transactions')
          .select()
          .eq('group_id', groupId)
          .order('created_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => Transaction.fromJson(json)).toList();
    } catch (e) {
      if (e is PostgrestException) {
        if (e.message.contains('Contribution limit exceeded')) {
          throw Exception('Contribution too large. Max 4,000 RWF.');
        }
        if (e.message.contains('Wallet balance limit exceeded')) {
          throw Exception('Wallet cap reached. Max 500,000 RWF.');
        }
      }
      rethrow;
    }
  }

  /// Create a pending transaction record (e.g. after USSD/Manual entry)
  Future<void> recordPendingTransaction({
    required String groupId,
    required int amount,
    String? proofUrl,
    String? transactionId,
    String currency = 'RWF',
    String type = 'deposit',
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    try {
      await _client.from('transactions').insert({
        'group_id': groupId,
        'member_id': user.id,
        'amount': amount,
        'currency': currency,
        'type': type,
        'status': 'pending',
        if (proofUrl != null) 'proof_url': proofUrl,
        if (transactionId != null) 'transaction_id': transactionId,
      });
    } catch (e) {
      if (e is PostgrestException) {
        if (e.message.contains('Contribution limit exceeded')) {
          throw Exception('Contribution too large. Max 4,000 RWF.');
        }
        if (e.message.contains('Wallet balance limit exceeded')) {
          throw Exception('Wallet cap reached. Max 500,000 RWF.');
        }
      }
      rethrow;
    }
  }
  /// Get confirmed and pending balances for a member
  Future<Map<String, double>> getWalletBalance(String memberId) async {
    try {
      final response = await _client
          .from('transactions')
          .select('amount, status')
          .eq('member_id', memberId);

      final List<dynamic> data = response as List<dynamic>;
      
      double confirmed = 0;
      double pending = 0;

      for (var tx in data) {
        final amount = (tx['amount'] as num).toDouble();
        final status = tx['status'] as String;

        if (status == 'confirmed') {
          confirmed += amount;
        } else if (status == 'pending') {
          pending += amount;
        }
      }

      return {
        'confirmed': confirmed,
        'pending': pending,
      };
    } catch (e) {
      // Return zeros on error or empty
      return {'confirmed': 0.0, 'pending': 0.0};
    }
  }

  /// Get period progress (confirmed amount vs target for current period)
  Future<Map<String, dynamic>> getPeriodProgress(String groupId, String userId, int targetAmount, String frequency) async {
    try {
      DateTime startOfPeriod;
      final now = DateTime.now();

      if (frequency == 'WEEKLY') {
        // Start of week (Monday)
        // ISO 8601: Monday=1, Sunday=7.
        // Subtract (weekday-1) days.
        startOfPeriod = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
      } else {
        // Monthly (default)
        startOfPeriod = DateTime(now.year, now.month, 1);
      }

      final response = await _client
          .from('transactions')
          .select('amount')
          .eq('group_id', groupId)
          .eq('member_id', userId)
          .eq('status', 'confirmed') // Only confirmed counts for progress
          .gte('created_at', startOfPeriod.toIso8601String());

      final total = (response as List).fold(0.0, (sum, item) => sum + (item['amount'] as num).toDouble());
      
      return {
        'current': total,
        'target': targetAmount.toDouble(),
        'frequency': frequency,
      };
    } catch (e) {
      return {'current': 0.0, 'target': targetAmount.toDouble(), 'frequency': frequency};
    }
  }

  /// Update a transaction (used for fixing rejected submissions)
  Future<void> updateTransaction({
    required String transactionId,
    required String newMoMoTransactionId,
    String? newProofUrl,
  }) async {
    try {
      final updates = {
        'transaction_id': newMoMoTransactionId,
        'status': 'pending', // Reset to pending for re-approval
        'updated_at': DateTime.now().toIso8601String(),
      };
      
      if (newProofUrl != null) {
        updates['proof_url'] = newProofUrl;
      }

      await _client
          .from('transactions')
          .update(updates)
          .eq('id', transactionId);
          
    } catch (e) {
      // Log error (in a real app)
      rethrow;
    }
  }
}

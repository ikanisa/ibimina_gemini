import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';

void main() {
  group('Transaction Model', () {
    test('fromJson creates correct Transaction instance', () {
      final json = {
        'id': 'tx_123',
        'type': 'deposit',
        'amount': 1000,
        'currency': 'RWF',
        'status': 'confirmed',
        'member_id': 'mem_456',
        'group_id': 'grp_789',
        'created_at': '2024-01-25T12:00:00.000Z',
        'proof_url': 'https://example.com/proof.jpg',
        'transaction_id': 'momo_abc'
      };

      final transaction = Transaction.fromJson(json);

      expect(transaction.id, 'tx_123');
      expect(transaction.type, 'deposit');
      expect(transaction.amount, 1000.0);
      expect(transaction.currency, 'RWF');
      expect(transaction.status, 'confirmed');
      expect(transaction.memberId, 'mem_456');
      expect(transaction.groupId, 'grp_789');
      expect(transaction.createdAt, DateTime.utc(2024, 1, 25, 12, 0, 0));
      expect(transaction.proofUrl, 'https://example.com/proof.jpg');
      expect(transaction.transactionId, 'momo_abc');
    });

    test('fromJson handles optional fields being null', () {
      final json = {
        'id': 'tx_123',
        'type': 'deposit',
        'amount': 1000,
        'currency': 'RWF',
        'status': 'pending',
        'created_at': '2024-01-25T12:00:00.000Z',
      };

      final transaction = Transaction.fromJson(json);

      expect(transaction.id, 'tx_123');
      expect(transaction.memberId, null);
      expect(transaction.groupId, null);
      expect(transaction.proofUrl, null);
      expect(transaction.transactionId, null);
    });

    test('fromJson handles int amount as double', () {
      final json = {
        'id': 'tx_123',
        'type': 'deposit',
        'amount': 2000, // int in JSON
        'currency': 'RWF',
        'status': 'confirmed',
        'created_at': '2024-01-25T12:00:00.000Z',
      };

      final transaction = Transaction.fromJson(json);

      expect(transaction.amount, 2000.0);
    });
  });
}

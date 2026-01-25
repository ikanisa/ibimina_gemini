import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/ledger/models/transaction_model.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';

final ledgerServiceProvider = Provider((ref) => LedgerService());

final groupTransactionsProvider = FutureProvider.family<List<Transaction>, String>((ref, groupId) async {
  final ledgerService = ref.watch(ledgerServiceProvider);
  return ledgerService.getGroupTransactions(groupId);
});

final walletBalanceProvider = FutureProvider.family<Map<String, double>, String>((ref, memberId) async {
  final ledgerService = ref.watch(ledgerServiceProvider);
  return ledgerService.getWalletBalance(memberId);
});

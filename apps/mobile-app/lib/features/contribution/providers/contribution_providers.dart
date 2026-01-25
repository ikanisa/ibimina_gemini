import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/contribution/services/contribution_service.dart';

final contributionServiceProvider = Provider((ref) => ContributionService());

/// State for the contribution flow.
class ContributionState {
  final int? amount;
  final bool ussdLaunched;
  final File? proofFile;
  final bool isUploading;
  final String? error;
  final bool isComplete;

  const ContributionState({
    this.amount,
    this.ussdLaunched = false,
    this.proofFile,
    this.isUploading = false,
    this.error,
    this.isComplete = false,
  });

  ContributionState copyWith({
    int? amount,
    bool? ussdLaunched,
    File? proofFile,
    bool? isUploading,
    String? error,
    bool? isComplete,
  }) {
    return ContributionState(
      amount: amount ?? this.amount,
      ussdLaunched: ussdLaunched ?? this.ussdLaunched,
      proofFile: proofFile ?? this.proofFile,
      isUploading: isUploading ?? this.isUploading,
      error: error,
      isComplete: isComplete ?? this.isComplete,
    );
  }
}

class ContributionNotifier extends Notifier<ContributionState> {
  @override
  ContributionState build() => const ContributionState();

  void setAmount(int amount) {
    state = state.copyWith(amount: amount);
  }

  void setUssdLaunched() {
    state = state.copyWith(ussdLaunched: true);
  }

  void setProofFile(File file) {
    state = state.copyWith(proofFile: file);
  }

  void setUploading(bool uploading) {
    state = state.copyWith(isUploading: uploading);
  }

  void setError(String? error) {
    state = state.copyWith(error: error);
  }

  void setComplete() {
    state = state.copyWith(isComplete: true);
  }

  void reset() {
    state = const ContributionState();
  }
}

final contributionNotifierProvider =
    NotifierProvider<ContributionNotifier, ContributionState>(
  ContributionNotifier.new,
);

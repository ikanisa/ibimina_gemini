import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/group_model.dart';
import '../models/membership.dart';
import '../services/group_repository.dart';

final groupRepositoryProvider = Provider((ref) => GroupRepository());

// Helper to get institution ID
final myInstitutionIdProvider = FutureProvider<String?>((ref) async {
  final repo = ref.watch(groupRepositoryProvider);
  return repo.getMyInstitutionId();
});

final myMembershipProvider = FutureProvider.autoDispose<GroupMembership?>((ref) async {
  final repo = ref.watch(groupRepositoryProvider);
  final institutionId = await ref.watch(myInstitutionIdProvider.future);
  
  if (institutionId == null) return null;
  
  try {
    return await repo.getMyMembership(institutionId);
  } catch (e) {
    return null;
  }
});

final currentGroupProvider = Provider.autoDispose<AsyncValue<Group?>>((ref) {
  final membership = ref.watch(myMembershipProvider);
  return membership.whenData((value) => value?.group);
});

// Adapter for HomeTab (List<Group>)
final userGroupsProvider = Provider.autoDispose<AsyncValue<List<Group>>>((ref) {
  final membershipAsync = ref.watch(myMembershipProvider);
  return membershipAsync.whenData((membership) => membership?.group != null ? [membership!.group!] : []);
});

final searchGroupsProvider = FutureProvider.family.autoDispose<List<Group>, String>((ref, query) async {
  final repository = ref.watch(groupRepositoryProvider);
  return repository.searchPublicGroups(query);
});

final groupMembersProvider = FutureProvider.family.autoDispose<List<GroupMembership>, String>((ref, groupId) async {
    final repository = ref.watch(groupRepositoryProvider);
    return repository.getGroupMembers(groupId);
});

class GroupController extends AsyncNotifier<void> {
  late final GroupRepository _repository;

  @override
  FutureOr<void> build() {
    _repository = ref.watch(groupRepositoryProvider);
    return null;
  }

  Future<void> createGroup({
    required String name,
    required String institutionId,
    String? description,
    GroupType type = GroupType.private,
    int contributionAmount = 0,
    String frequency = 'MONTHLY',
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await _repository.createGroup(
        name: name,
        institutionId: institutionId,
        description: description,
        type: type,
        contributionAmount: contributionAmount,
        frequency: frequency,
      );
      ref.invalidate(myMembershipProvider);
      ref.invalidate(myInstitutionIdProvider);
    });
  }

  Future<void> joinGroup(String inviteCode) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await _repository.joinGroup(inviteCode);
      ref.invalidate(myMembershipProvider);
      ref.invalidate(myInstitutionIdProvider);
    });
  }
}

final groupControllerProvider = AsyncNotifierProvider<GroupController, void>(GroupController.new);

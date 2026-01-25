import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ibimina_mobile/features/invites/services/invite_service.dart';
import 'package:ibimina_mobile/features/invites/services/deep_link_service.dart';

// Dependency: Supabase Client
final supabaseClientProvider = Provider((ref) => Supabase.instance.client);

final inviteServiceProvider = Provider<InviteService>((ref) {
  return InviteService(ref.watch(supabaseClientProvider));
});

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  return DeepLinkService();
});

// Stream of invite tokens
final inviteTokenStreamProvider = StreamProvider<String>((ref) {
  final service = ref.watch(deepLinkServiceProvider);
  // Ensure service is initialized if not already?
  // Ideally, init is called in main, but we can access the stream here.
  return service.inviteTokens;
});

import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // TODO: Move to .env or --dart-define
  static const String url = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
  static const String anonKey = 'YOUR_SUPABASE_ANON_KEY';
}

final supabase = Supabase.instance.client;

Future<void> initSupabase({String? url, String? anonKey}) async {
  await Supabase.initialize(
    url: url ?? SupabaseConfig.url,
    anonKey: anonKey ?? SupabaseConfig.anonKey,
  );
}

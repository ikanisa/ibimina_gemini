import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/core/theme/app_theme.dart';
import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';
import 'package:ibimina_mobile/features/auth/widgets/auth_wrapper.dart';
import 'package:ibimina_mobile/core/router/app_router.dart';
import 'package:ibimina_mobile/core/services/deep_link_service.dart';
import 'package:ibimina_mobile/config/app_config.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

void main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    const flavor = String.fromEnvironment('FLAVOR', defaultValue: 'prod');

    AppConfig.init(
      flavor: flavor == 'dev' ? AppFlavor.dev : AppFlavor.prod,
      appName: flavor == 'dev' ? 'Ibimina Dev' : 'Ibimina',
      apiBaseUrl: flavor == 'dev' ? 'https://dev-api.ibimina.rw' : 'https://api.ibimina.rw',
      sentryDsn: const String.fromEnvironment('SENTRY_DSN'),
    );

    // Initialize Supabase
    const supabaseUrl = String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: 'https://your-project.supabase.co',
    );
    const supabaseAnonKey = String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'your-anon-key',
    );

    try {
      await initSupabase(url: supabaseUrl, anonKey: supabaseAnonKey);
    } catch (e) {
      AppLogger.error('Supabase init failed', error: e, tag: 'Init');
    }

    if (AppConfig.instance.sentryDsn != null && AppConfig.instance.sentryDsn!.isNotEmpty) {
      await SentryFlutter.init(
        (options) {
          options.dsn = AppConfig.instance.sentryDsn;
          options.tracesSampleRate = 1.0;
          options.environment = AppConfig.instance.flavor.name;
        },
        appRunner: () => runApp(const ProviderScope(child: IbiminaApp())),
      );
    } else {
      runApp(const ProviderScope(child: IbiminaApp()));
    }
  }, (exception, stackTrace) async {
    await Sentry.captureException(exception, stackTrace: stackTrace);
  });
}

class IbiminaApp extends ConsumerStatefulWidget {
  const IbiminaApp({super.key});

  @override
  ConsumerState<IbiminaApp> createState() => _IbiminaAppState();
}

class _IbiminaAppState extends ConsumerState<IbiminaApp> {
  @override
  void initState() {
    super.initState();
    // Initialize Deep Link Service
    // Using addPostFrameCallback to ensure provider is ready if needed, keeping it safe.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Create instances of services if using GetIt or similar, otherwise ensure
      // they are listening.
      DeepLinkService().init(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Init DeepLinkService execution
    // Service initialized in initState
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'Ibimina',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

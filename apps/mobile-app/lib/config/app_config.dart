enum AppFlavor {
  dev,
  prod,
}

class AppConfig {
  final AppFlavor flavor;
  final String appName;
  final String apiBaseUrl;
  final String? sentryDsn;

  AppConfig({
    required this.flavor,
    required this.appName,
    required this.apiBaseUrl,
    this.sentryDsn,
  });

  static AppConfig? _instance;

  static void init({
    required AppFlavor flavor,
    required String appName,
    required String apiBaseUrl,
    String? sentryDsn,
  }) {
    _instance = AppConfig(
      flavor: flavor,
      appName: appName,
      apiBaseUrl: apiBaseUrl,
      sentryDsn: sentryDsn,
    );
  }

  static AppConfig get instance {
    if (_instance == null) {
      throw Exception('AppConfig not initialized. Call AppConfig.init() first.');
    }
    return _instance!;
  }
}

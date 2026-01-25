import 'package:app_links/app_links.dart';
import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  late AppLinks _appLinks;

  /// UUID v4 pattern for token validation
  static final _uuidPattern = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  void init(BuildContext context) {
    _appLinks = AppLinks();
    
    // Check initial link if any
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        _handleDeepLink(context, uri);
      }
    });

    // Listen for new links
    _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(context, uri);
    });
  }

  void _handleDeepLink(BuildContext context, Uri uri) {
     // Log masked URI for debugging (do not log full URI with tokens)
     AppLogger.debug('Deep Link received: ${uri.host}${uri.path}', tag: 'DeepLink');
     
     // Handle /join?token=XYZ
     if (uri.pathSegments.contains('join')) {
         final token = uri.queryParameters['token'];
         if (token != null && _isValidToken(token)) {
             context.push('/join', extra: {'token': token});
         } else if (token != null) {
             AppLogger.warn('Invalid token format rejected', tag: 'DeepLink');
         }
     }
     
     // Handle other deep links (e.g. invite codes embedded in path)
     // ibimina://join/XYZ
     if (uri.pathSegments.length >= 2 && uri.pathSegments[0] == 'join') {
          final token = uri.pathSegments[1];
          if (_isValidToken(token)) {
              context.push('/join', extra: {'token': token});
          } else {
              AppLogger.warn('Invalid token format in path rejected', tag: 'DeepLink');
          }
     }
  }

  /// Validate token format (UUID expected)
  bool _isValidToken(String token) {
    return _uuidPattern.hasMatch(token);
  }
}


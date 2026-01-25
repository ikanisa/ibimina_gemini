import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';

class DeepLinkService {
  final AppLinks _appLinks = AppLinks();
  
  // Broadcast stream for invite tokens found in deep links
  final StreamController<String> _inviteTokenController = StreamController<String>.broadcast();
  // Broadcast stream for contribution params found in deep links
  final StreamController<Map<String, dynamic>> _contributionController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<String> get inviteTokens => _inviteTokenController.stream;
  Stream<Map<String, dynamic>> get contributions => _contributionController.stream;

  /// Initialize deep link listening. call this early.
  Future<void> init() async {
    try {
      // Check for initial link (app opened via link)
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _checkDeepLink(initialUri);
      }

      // Listen for new links while app is running
      _appLinks.uriLinkStream.listen((uri) {
        _checkDeepLink(uri);
      }, onError: (err) {
        AppLogger.error('Deep Link stream error', error: err, tag: 'DeepLink');
      });
    } catch (e) {
      AppLogger.error('Deep Link init failed', error: e, tag: 'DeepLink');
    }
  }

  void _checkDeepLink(Uri uri) {
    // Log masked URI for debugging (tokens will be masked by AppLogger)
    AppLogger.debug('Deep Link received: ${uri.host}${uri.path}', tag: 'DeepLink');
    
    // Expected format: https://ibimina.app/join/<token> or ibimina://join/<token>
    // checking path segments
    if (uri.pathSegments.contains('join')) {
      // Find 'join' and take the next segment as token
      final joinIndex = uri.pathSegments.indexOf('join');
      if (joinIndex + 1 < uri.pathSegments.length) {
        final token = uri.pathSegments[joinIndex + 1];
        
        // Validate token format (should be UUID)
        if (token.isNotEmpty && _isValidTokenFormat(token)) {
           _inviteTokenController.add(token);
           AppLogger.debug('Valid invite token extracted', tag: 'DeepLink');
        } else {
          AppLogger.warn('Invalid invite token format rejected', tag: 'DeepLink');
        }
      }
    } else if (uri.pathSegments.contains('contribute')) {
      // https://ibimina.app/contribute?g=<groupId>&a=<amount>
      final params = uri.queryParameters;
      if (params.containsKey('g')) {
        final groupId = params['g'];
        
        // Validate group ID format (should be UUID)
        if (groupId != null && _isValidTokenFormat(groupId)) {
          _contributionController.add({
            'groupId': groupId,
            'amount': int.tryParse(params['a'] ?? '0'),
          });
        } else {
          AppLogger.warn('Invalid group ID format rejected', tag: 'DeepLink');
        }
      }
    }
  }

  /// Validate token format (UUID v4 format expected)
  bool _isValidTokenFormat(String token) {
    // UUID v4 pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    final uuidPattern = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );
    return uuidPattern.hasMatch(token);
  }
}


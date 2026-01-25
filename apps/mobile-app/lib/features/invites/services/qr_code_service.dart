import 'dart:convert';

class QRCodeService {
  static const int currentVersion = 1;

  /// Parses a QR code string.
  /// Returns a Map with 'type' (INVITE/CONTRIB) and 'data' (Map).
  /// Falls back to legacy URL parsing for Invites.
  static Map<String, dynamic> parse(String code) {
    if (code.isEmpty) return {'type': 'UNKNOWN'};

    try {
      // 1. Try JSON parsing (Standard Format)
      final json = jsonDecode(code);
      if (json is Map<String, dynamic> &&
          json.containsKey('t') &&
          json.containsKey('d')) {
        // Enforce Version check if present (default to 1 if missing for backward formatting compatibility,
        // but ideally we want strict versioning. Let's start lenient for V1).
        final version = json['v'] as int?;
        if (version != null && version != currentVersion) {
            return {'type': 'UNSUPPORTED_VERSION', 'v': version};
        }

        return {
          'type': json['t'],
          'data': json['d'],
        };
      }
    } catch (_) {
      // Not JSON, fall back to legacy logic
    }

    // 2. Fallback: Legacy URL or Raw Token
    // We assume it's an INVITE if it looks like a URL with 'join' or just a string
    // This allows backward compatibility with "https://ibimina.app/join/TOKEN"
    // OR plain tokens passed directly.
    
    // Simple heuristic: if it contains "http", treat as deep link, else raw token
    String token = code;
    if (code.startsWith('http')) {
        final uri = Uri.tryParse(code);
        if (uri != null && uri.pathSegments.contains('join')) {
           token = uri.pathSegments.last; // naive extraction
        }
    }

    return {
      'type': 'INVITE',
      'data': {'token': token, 'legacy': true},
    };
  }

  /// Generates an Invite QR Payload
  static String generateInvitePayload(String token) {
    return jsonEncode({
      'v': currentVersion,
      't': 'INVITE',
      'd': {'token': token},
    });
  }

  /// Generates a Contribution QR Payload
  static String generateContributionPayload(String groupId, int suggestedAmount) {
    return jsonEncode({
      'v': currentVersion,
      't': 'CONTRIB',
      'd': {'gid': groupId, 'amt': suggestedAmount},
    });
  }
}

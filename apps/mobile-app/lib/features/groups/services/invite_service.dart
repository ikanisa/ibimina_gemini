class InviteService {
  /// Generates a sharable invite link.
  /// Format: https://ibimina.app/invite?code=XYZ123
  /// Or deep link scheme: ibimina://invite?code=XYZ123
  static String generateInviteLink(String inviteCode) {
    return 'https://ibimina.app/invite?code=$inviteCode';
  }

  /// Generates data for QR Code.
  /// We just use the invite code or the full link.
  /// Using JSON to allow future extensibility? Or just the code?
  /// Just the code or link is standard.
  static String generateQrData(String inviteCode) {
    return inviteCode; // Simple is better for manual entry backup
  }

  /// Parses an invite code from a link or returns the string if it's just a code.
  static String? parseInviteCode(String input) {
    if (input.isEmpty) return null;
    
    final uri = Uri.tryParse(input);
    if (uri != null && uri.queryParameters.containsKey('code')) {
      return uri.queryParameters['code'];
    }
    
    // Assume input is the code itself if no URL param
    // Basic validation: Is it alphanumeric?
    // Let's iterate: Return cleaned input
    return input.trim().toUpperCase();
  }
}

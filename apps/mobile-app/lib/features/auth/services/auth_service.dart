import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';

/// Auth service supporting email, Google, and phone OTP authentication.
class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email'],
  );

  // ============================================
  // EMAIL AUTHENTICATION
  // ============================================

  /// Sign up with email and password.
  Future<AuthResponse> signUpWithEmail(String email, String password) async {
    final response = await supabase.auth.signUp(
      email: email,
      password: password,
    );
    return response;
  }

  /// Sign in with email and password.
  Future<AuthResponse> signInWithEmail(String email, String password) async {
    final response = await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
    return response;
  }

  /// Send password reset email.
  Future<void> resetPassword(String email) async {
    await supabase.auth.resetPasswordForEmail(email);
  }

  // ============================================
  // GOOGLE AUTHENTICATION
  // ============================================

  /// Sign in with Google.
  /// Returns null if user cancels the sign-in flow.
  Future<AuthResponse?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled
        return null;
      }

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      final accessToken = googleAuth.accessToken;

      if (idToken == null) {
        throw Exception('Failed to get Google ID token');
      }

      final response = await supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

      return response;
    } catch (e) {
      AppLogger.error('Google sign-in failed', error: e, tag: 'Auth');
      rethrow;
    }
  }

  /// Sign out from Google (clears cached credentials).
  Future<void> signOutGoogle() async {
    await _googleSignIn.signOut();
  }

  // ============================================
  // PHONE OTP AUTHENTICATION
  // ============================================

  /// Send OTP to phone number.
  /// [phone] must be in E.164 format (e.g., +250788123456)
  Future<void> sendOtp(String phone) async {
    if (!phone.startsWith('+250')) {
      throw ArgumentError('Phone number must start with +250 (Rwanda)');
    }
    if (phone.length != 13) {
      throw ArgumentError('Phone number must be 13 characters (+250XXXXXXXXX)');
    }

    await supabase.auth.signInWithOtp(
      phone: phone,
    );
  }

  /// Verify OTP and sign in.
  Future<AuthResponse> verifyOtp(String phone, String token) async {
    final response = await supabase.auth.verifyOTP(
      phone: phone,
      token: token,
      type: OtpType.sms,
    );
    return response;
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /// Sign out the current user (all providers).
  Future<void> signOut() async {
    // Sign out from Google if applicable
    try {
      await _googleSignIn.signOut();
    } catch (_) {
      // Ignore Google sign out errors
    }

    await supabase.auth.signOut();
  }

  /// Get the current user session.
  Session? get currentSession => supabase.auth.currentSession;

  /// Get the current user.
  User? get currentUser => supabase.auth.currentUser;

  /// Stream of auth state changes.
  Stream<AuthState> get authStateChanges => supabase.auth.onAuthStateChange;

  /// Check if user is authenticated.
  bool get isAuthenticated => currentSession != null;

  /// Get the auth method used for current session.
  String? get authMethod {
    final user = currentUser;
    if (user == null) return null;

    final provider = user.appMetadata['provider'] as String?;
    if (provider == 'google') return 'google';
    if (provider == 'email') return 'email';
    if (user.phone != null && user.phone!.isNotEmpty) return 'phone';
    return provider;
  }
}

/// Spacing tokens for consistent layout throughout the app.
/// 
/// Usage: `AppSpacing.md` for 16px spacing.
abstract class AppSpacing {
  /// 4px - Minimal spacing (borders, tight elements)
  static const double xs = 4;

  /// 8px - Small spacing (icon gaps, compact lists)
  static const double sm = 8;

  /// 12px - Medium-small spacing (form elements)
  static const double ms = 12;

  /// 16px - Medium spacing (default padding)
  static const double md = 16;

  /// 24px - Large spacing (section gaps)
  static const double lg = 24;

  /// 32px - Extra large spacing (major sections)
  static const double xl = 32;

  /// 48px - Extra extra large spacing (hero areas)
  static const double xxl = 48;

  // Common padding values
  /// Default screen padding (16px horizontal)
  static const double screenPadding = md;

  /// Card internal padding (16px)
  static const double cardPadding = md;

  /// Section vertical spacing (24px)
  static const double sectionSpacing = lg;
}

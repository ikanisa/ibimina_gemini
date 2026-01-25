/// Border radius tokens for consistent rounded corners.
/// 
/// Usage: `BorderRadius.circular(AppRadius.md)`.
abstract class AppRadius {
  /// 8px - Small radius (buttons, small cards)
  static const double sm = 8;

  /// 12px - Medium radius (cards, inputs)
  static const double md = 12;

  /// 16px - Large radius (modals, bottom sheets)
  static const double lg = 16;

  /// 20px - Extra large radius (hero cards)
  static const double xl = 20;

  /// 9999px - Full/pill radius (pills, avatars)
  static const double full = 9999;
}

import 'package:flutter/animation.dart';

/// Motion/animation duration tokens for consistent timing.
/// 
/// Usage: `Duration(milliseconds: AppMotion.fast)`.
abstract class AppMotion {
  /// 100ms - Instant feedback (button press, toggle)
  static const int instant = 100;

  /// 150ms - Fast transitions (hover states, small reveals)
  static const int fast = 150;

  /// 200ms - Default duration (most UI transitions)
  static const int normal = 200;

  /// 250ms - Moderate duration (larger reveals, sheets)
  static const int moderate = 250;

  /// 300ms - Slow duration (complex animations)
  static const int slow = 300;

  /// 400ms - Very slow duration (page transitions)
  static const int verySlow = 400;

  // Curve presets
  /// Default curve for UI animations
  static const Curve defaultCurve = Curves.easeOutCubic;

  /// Emphasized curve for entrances
  static const Curve enterCurve = Curves.easeOutBack;

  /// Exit curve for dismissals
  static const Curve exitCurve = Curves.easeInCubic;
}

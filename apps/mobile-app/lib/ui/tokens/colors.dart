import 'package:flutter/material.dart';

/// Raw color palette (Primitives).
///
/// These should NOT be used directly in UI widgets.
/// Use [AppColors] semantic tokens instead.
abstract class AppPalette {
  // Emerald (Primary)
  static const emerald400 = Color(0xFF34D399);
  static const emerald500 = Color(0xFF10B981);
  static const emerald700 = Color(0xFF047857);

  // Slate (Neutrals)
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);

  // Semantic mappings
  static const white = Color(0xFFFFFFFF);
  static const red500 = Color(0xFFEF4444);
  static const orange500 = Color(0xFFF59E0B);
  static const blue500 = Color(0xFF3B82F6);
  static const green500 = Color(0xFF22C55E);
}

/// Semantic color tokens for Ibimina design system.
///
/// Supports both light and dark themes.
abstract class AppColors {
  // ============================================
  // PRIMARY PALETTE
  // ============================================

  static const Color primary = AppPalette.emerald500;
  static const Color primaryDark = AppPalette.emerald700;
  static const Color primaryLight = AppPalette.emerald400;

  // ============================================
  // STATUS COLORS
  // ============================================

  static const Color success = AppPalette.green500;
  static const Color error = AppPalette.red500;
  static const Color warning = AppPalette.orange500;
  static const Color info = AppPalette.blue500;

  // ============================================
  // DARK THEME PALETTE
  // ============================================

  static const Color darkBackground = AppPalette.slate900;
  static const Color darkSurface = AppPalette.slate800;
  static const Color darkSurfaceVariant = AppPalette.slate700;
  static const Color darkTextPrimary = AppPalette.slate50;
  static const Color darkTextSecondary = AppPalette.slate400;
  static const Color darkTextHint = AppPalette.slate500;
  static const Color darkBorder = AppPalette.slate600;

  // ============================================
  // LIGHT THEME PALETTE
  // ============================================

  static const Color lightBackground = AppPalette.slate50;
  static const Color lightSurface = AppPalette.white;
  static const Color lightSurfaceVariant = AppPalette.slate100;
  static const Color lightTextPrimary = AppPalette.slate900;
  static const Color lightTextSecondary = AppPalette.slate600;
  static const Color lightTextHint = AppPalette.slate400;
  static const Color lightBorder = AppPalette.slate200;

  // ============================================
  // LEGACY ALIASES (Deprecated)
  // ============================================
  
  @Deprecated('Use darkBackground instead')
  static const Color background = darkBackground;
  
  @Deprecated('Use darkSurface instead')
  static const Color surface = darkSurface;
  
  @Deprecated('Use darkSurfaceVariant instead')
  static const Color surfaceLight = darkSurfaceVariant;
  
  @Deprecated('Use darkTextPrimary instead')
  static const Color textPrimary = darkTextPrimary;
  
  @Deprecated('Use darkTextSecondary instead')
  static const Color textSecondary = darkTextSecondary;

  @Deprecated('Use darkBorder instead')
  static const Color border = darkBorder;

  @Deprecated('Use darkSurfaceVariant instead')
  static const Color surfaceVariant = darkSurfaceVariant;
}

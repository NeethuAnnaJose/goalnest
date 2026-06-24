import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  // Brand (light)
  static const Color primary = Color(0xFF1A7F55);
  static const Color primaryDark = Color(0xFF065F46);
  static const Color primaryLight = Color(0xFF10B981);
  static const Color primaryMuted = Color(0xFFD1FAE5);
  static const Color accent = Color(0xFF14B8A6);

  // Brand (dark)
  static const Color primaryDarkMode = Color(0xFF30B07C);
  static const Color primaryLightDarkMode = Color(0xFF34D399);

  // Semantic
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF0D9488)],
  );

  static const LinearGradient cardAccentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
  );

  static const double radiusSm = 12;
  static const double radiusMd = 16;
  static const double radiusLg = 20;
  static const double radiusXl = 24;

  // Legacy light tokens (prefer context.appColors in new code)
  static const Color surface = Color(0xFFF7FAF9);
  static const Color surfaceVariant = Color(0xFFEDF2F0);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0D1A17);
  static const Color textSecondary = Color(0xFF64746E);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color border = Color(0xFFDBE4E0);

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: primary.withValues(alpha: 0.06),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> cardShadowFor(BuildContext context) => [
        BoxShadow(
          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.06),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: context.isDark ? 0.25 : 0.04),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final brandPrimary = isDark ? primaryDarkMode : primary;
    final onPrimary = isDark ? const Color(0xFF0A0F0E) : Colors.white;

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: brandPrimary,
        onPrimary: onPrimary,
        secondary: isDark ? primaryLightDarkMode : primaryLight,
        onSecondary: onPrimary,
        surface: colors.background,
        onSurface: isDark ? const Color(0xFFF2F7F5) : const Color(0xFF0D1A17),
        error: danger,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: colors.background,
      extensions: [colors],
    );

    final inter = GoogleFonts.interTextTheme(base.textTheme);
    final onSurface = base.colorScheme.onSurface;
    final textTheme = inter.copyWith(
      headlineLarge: GoogleFonts.plusJakartaSans(
        textStyle: inter.headlineLarge?.copyWith(fontWeight: FontWeight.w800, color: onSurface, letterSpacing: -0.5),
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        textStyle: inter.headlineMedium?.copyWith(fontWeight: FontWeight.w700, color: onSurface, letterSpacing: -0.3),
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        textStyle: inter.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: onSurface),
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        textStyle: inter.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: onSurface),
      ),
      bodyMedium: inter.bodyMedium?.copyWith(color: onSurface),
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        backgroundColor: Colors.transparent,
        foregroundColor: onSurface,
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: onSurface,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: BorderSide(color: colors.border, width: 0.5),
        ),
        color: colors.card,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? colors.muted : colors.muted,
        labelStyle: TextStyle(color: colors.mutedForeground, fontWeight: FontWeight.w500),
        hintStyle: TextStyle(color: colors.mutedForeground.withValues(alpha: 0.8)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide(color: colors.border, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide(color: brandPrimary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brandPrimary,
          foregroundColor: onPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 0.2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brandPrimary,
          foregroundColor: onPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: onSurface,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          side: BorderSide(color: colors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: brandPrimary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: brandPrimary,
        foregroundColor: onPrimary,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 72,
        backgroundColor: colors.card,
        indicatorColor: brandPrimary.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: brandPrimary);
          }
          return TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: colors.mutedForeground);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: brandPrimary, size: 24);
          }
          return IconThemeData(color: colors.mutedForeground, size: 24);
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
      ),
      dividerTheme: DividerThemeData(color: colors.border, thickness: 0.5),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: brandPrimary),
    );
  }
}

import 'package:flutter/material.dart';

@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.background,
    required this.card,
    required this.muted,
    required this.mutedForeground,
    required this.border,
    required this.heroTint,
    required this.heroGlow,
    required this.featureSectionBg,
    required this.launchCardStart,
    required this.launchCardEnd,
    required this.launchBorder,
    required this.footerBg,
    required this.logoRing,
  });

  final Color background;
  final Color card;
  final Color muted;
  final Color mutedForeground;
  final Color border;
  final Color heroTint;
  final Color heroGlow;
  final Color featureSectionBg;
  final Color launchCardStart;
  final Color launchCardEnd;
  final Color launchBorder;
  final Color footerBg;
  final Color logoRing;

  static const light = AppColors(
    background: Color(0xFFF7FAF9),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFEDF2F0),
    mutedForeground: Color(0xFF64746E),
    border: Color(0xFFDBE4E0),
    heroTint: Color(0xFFECFDF5),
    heroGlow: Color(0x1410B981),
    featureSectionBg: Color(0x99EDF2F0),
    launchCardStart: Color(0xFFECFDF5),
    launchCardEnd: Color(0xFFF0FDFA),
    launchBorder: Color(0x6610B981),
    footerBg: Color(0x66EDF2F0),
    logoRing: Color(0x0D000000),
  );

  static const dark = AppColors(
    background: Color(0xFF0A0F0E),
    card: Color(0xFF111816),
    muted: Color(0xFF1A211F),
    mutedForeground: Color(0xFF8A9692),
    border: Color(0xFF232B29),
    heroTint: Color(0x66022422),
    heroGlow: Color(0x1410B981),
    featureSectionBg: Color(0x4D1A211F),
    launchCardStart: Color(0xFF022422),
    launchCardEnd: Color(0xFF042F2E),
    launchBorder: Color(0x6610B981),
    footerBg: Color(0x4D1A211F),
    logoRing: Color(0x1AFFFFFF),
  );

  @override
  AppColors copyWith({
    Color? background,
    Color? card,
    Color? muted,
    Color? mutedForeground,
    Color? border,
    Color? heroTint,
    Color? heroGlow,
    Color? featureSectionBg,
    Color? launchCardStart,
    Color? launchCardEnd,
    Color? launchBorder,
    Color? footerBg,
    Color? logoRing,
  }) {
    return AppColors(
      background: background ?? this.background,
      card: card ?? this.card,
      muted: muted ?? this.muted,
      mutedForeground: mutedForeground ?? this.mutedForeground,
      border: border ?? this.border,
      heroTint: heroTint ?? this.heroTint,
      heroGlow: heroGlow ?? this.heroGlow,
      featureSectionBg: featureSectionBg ?? this.featureSectionBg,
      launchCardStart: launchCardStart ?? this.launchCardStart,
      launchCardEnd: launchCardEnd ?? this.launchCardEnd,
      launchBorder: launchBorder ?? this.launchBorder,
      footerBg: footerBg ?? this.footerBg,
      logoRing: logoRing ?? this.logoRing,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      background: Color.lerp(background, other.background, t)!,
      card: Color.lerp(card, other.card, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      border: Color.lerp(border, other.border, t)!,
      heroTint: Color.lerp(heroTint, other.heroTint, t)!,
      heroGlow: Color.lerp(heroGlow, other.heroGlow, t)!,
      featureSectionBg: Color.lerp(featureSectionBg, other.featureSectionBg, t)!,
      launchCardStart: Color.lerp(launchCardStart, other.launchCardStart, t)!,
      launchCardEnd: Color.lerp(launchCardEnd, other.launchCardEnd, t)!,
      launchBorder: Color.lerp(launchBorder, other.launchBorder, t)!,
      footerBg: Color.lerp(footerBg, other.footerBg, t)!,
      logoRing: Color.lerp(logoRing, other.logoRing, t)!,
    );
  }
}

extension AppColorsContext on BuildContext {
  AppColors get appColors => Theme.of(this).extension<AppColors>() ?? AppColors.light;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}

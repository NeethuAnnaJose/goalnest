import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum GoalNestLogoSize { sm, md, lg }

class GoalNestLogo extends StatelessWidget {
  const GoalNestLogo({
    super.key,
    this.size = GoalNestLogoSize.md,
    this.showText = true,
    this.light = false,
  });

  final GoalNestLogoSize size;
  final bool showText;
  final bool light;

  double get _iconSize => switch (size) {
        GoalNestLogoSize.sm => 28,
        GoalNestLogoSize.md => 36,
        GoalNestLogoSize.lg => 44,
      };

  double get _titleSize => switch (size) {
        GoalNestLogoSize.sm => 16,
        GoalNestLogoSize.md => 18,
        GoalNestLogoSize.lg => 24,
      };

  @override
  Widget build(BuildContext context) {
    final fg = light ? Colors.white : AppTheme.textPrimary;
    final sub = light ? Colors.white70 : AppTheme.textMuted;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: _iconSize,
          height: _iconSize,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(_iconSize * 0.28),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: light ? 0.2 : 0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Icon(
            Icons.trending_up_rounded,
            color: Colors.white,
            size: _iconSize * 0.55,
          ),
        ),
        if (showText) ...[
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'GoalNest',
                style: TextStyle(
                  fontSize: _titleSize,
                  fontWeight: FontWeight.w800,
                  color: fg,
                  letterSpacing: -0.3,
                  height: 1.1,
                ),
              ),
              Text(
                'Personal finance',
                style: TextStyle(
                  fontSize: _titleSize * 0.55,
                  fontWeight: FontWeight.w500,
                  color: sub,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

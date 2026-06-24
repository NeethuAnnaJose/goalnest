import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum GoalNestLogoSize { sm, md, lg }

class GoalNestLogo extends StatelessWidget {
  const GoalNestLogo({
    super.key,
    this.size = GoalNestLogoSize.md,
    this.showText = true,
    this.light = false,
    this.onTap,
  });

  final GoalNestLogoSize size;
  final bool showText;
  final bool light;
  final VoidCallback? onTap;

  static const _assetPath = 'assets/images/goalnest-logo.png';

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
    final colors = context.appColors;
    final fg = light ? Colors.white : Theme.of(context).colorScheme.onSurface;
    final sub = light ? const Color(0xCCA7F3D0) : colors.mutedForeground;

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: _iconSize,
          height: _iconSize,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(_iconSize * 0.28),
            border: Border.all(color: light ? Colors.white24 : colors.logoRing),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: light ? 0.1 : 0.06),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.asset(
            _assetPath,
            width: _iconSize,
            height: _iconSize,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => ColoredBox(
              color: Theme.of(context).colorScheme.primary,
              child: Icon(Icons.trending_up_rounded, color: Colors.white, size: _iconSize * 0.55),
            ),
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

    if (onTap == null) return content;
    return GestureDetector(onTap: onTap, child: content);
  }
}

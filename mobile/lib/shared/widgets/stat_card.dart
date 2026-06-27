import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import 'app_decorations.dart';

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.subtitle,
    this.color,
    this.compact = false,
  });

  final String title;
  final String value;
  final IconData icon;
  final String? subtitle;
  final Color? color;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppTheme.primary;
    final colors = context.appColors;
    final onCard = Theme.of(context).colorScheme.onSurface;

    return Container(
      decoration: AppDecorations.card(context),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(
              width: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [accent, accent.withValues(alpha: 0.5)],
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(compact ? 14 : 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: colors.mutedForeground,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.2,
                            ),
                      ),
                      SizedBox(height: compact ? 4 : 6),
                      Text(
                        value,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: compact ? 18 : 22,
                              letterSpacing: -0.5,
                              color: onCard,
                            ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: colors.mutedForeground,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  width: compact ? 40 : 48,
                  height: compact ? 40 : 48,
                  decoration: AppDecorations.iconBadge(accent),
                  child: Icon(icon, color: accent, size: compact ? 20 : 24),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'app_decorations.dart';

class AppListTile extends StatelessWidget {
  const AppListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.leadingIcon,
    this.leadingColor,
    this.onTap,
    this.onLongPress,
    this.highlightColor,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final IconData? leadingIcon;
  final Color? leadingColor;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final Color? highlightColor;

  @override
  Widget build(BuildContext context) {
    final accent = leadingColor ?? AppTheme.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          onLongPress: onLongPress,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          child: Ink(
            decoration: AppDecorations.card(
              color: highlightColor ?? AppTheme.cardBg,
              elevated: highlightColor == null,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  if (leadingIcon != null) ...[
                    Container(
                      width: 44,
                      height: 44,
                      decoration: AppDecorations.iconBadge(accent),
                      child: Icon(leadingIcon, color: accent, size: 22),
                    ),
                    const SizedBox(width: 14),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        if (subtitle != null) ...[
                          const SizedBox(height: 3),
                          Text(
                            subtitle!,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

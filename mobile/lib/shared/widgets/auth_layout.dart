import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'goalnest_logo.dart';
import 'theme_toggle_button.dart';

/// Matches web `AuthLayout` — logo, title, subtitle, and form card.
class AuthLayout extends StatelessWidget {
  const AuthLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    this.onLogoTap,
    this.footer,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final VoidCallback? onLogoTap;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(32, 48, 32, 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GoalNestLogo(size: GoalNestLogoSize.md, onTap: onLogoTap),
                      const SizedBox(height: 32),
                      Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: colors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: colors.border),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: context.isDark ? 0.2 : 0.04),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              title,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              subtitle,
                              style: TextStyle(color: colors.mutedForeground, fontSize: 15, height: 1.4),
                            ),
                            const SizedBox(height: 28),
                            child,
                          ],
                        ),
                      ),
                      if (footer != null) ...[
                        const SizedBox(height: 20),
                        DefaultTextStyle(
                          style: TextStyle(color: colors.mutedForeground, fontSize: 14),
                          child: footer!,
                        ),
                      ],
                      const SizedBox(height: 16),
                      Text(
                        '© 2026 GoalNest',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: scheme.primary.withValues(alpha: 0.7)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Positioned(top: 8, right: 16, child: ThemeToggleButton()),
          ],
        ),
      ),
    );
  }
}

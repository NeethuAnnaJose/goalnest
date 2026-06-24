import 'dart:ui';

import 'package:flutter/material.dart';
import '../../../core/constants/billing_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/goalnest_logo.dart';
import '../../../shared/widgets/theme_toggle_button.dart';
import '../../auth/screens/login_screen.dart';
import '../../auth/screens/register_screen.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  static const _features = [
    _Feature(Icons.bar_chart_rounded, 'Dashboard', 'Income, expenses, savings, and safe-to-spend in one place.', Color(0xFF10B981), Color(0x3310B981)),
    _Feature(Icons.flag_rounded, 'Goals', 'Set goals and use planners for house, car, wedding, and more.', Color(0xFF7C3AED), Color(0x337C3AED)),
    _Feature(Icons.shopping_cart_rounded, 'Affordability', 'Check if a purchase fits your budget before you buy.', Color(0xFFE11D48), Color(0x33E11D48)),
    _Feature(Icons.savings_rounded, 'Savings', 'Track bank accounts, FDs, mutual funds, and cash.', Color(0xFF0EA5E9), Color(0x330EA5E9)),
    _Feature(Icons.account_balance_rounded, 'Loans', 'Track loans, EMIs, and upcoming payments.', Color(0xFFF59E0B), Color(0x33F59E0B)),
    _Feature(Icons.description_rounded, 'Reports', 'Generate and download financial reports.', Color(0xFF64748B), Color(0x3364748B)),
  ];

  static const _highlights = [
    'Built for Indian salaries & EMIs',
    'Budget alerts when you overspend',
    'No bank login required to start',
    'Works on phone and desktop',
  ];

  static const _launchPerks = [
    'Unlimited goals and planners',
    'Affordability checks before you buy',
    'Reports with Excel export',
    'Budget alerts and money notes',
  ];

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: colors.background,
      body: CustomScrollView(
        slivers: [
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyNavDelegate(
              child: _LandingNav(
                onLogin: () => _openLogin(context),
                onRegister: () => _openRegister(context),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: _HeroSection(
              onLogin: () => _openLogin(context),
              onRegister: () => _openRegister(context),
              isDark: isDark,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
          SliverToBoxAdapter(child: _FeaturesSection(features: _features)),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
          SliverToBoxAdapter(child: _WhySection(highlights: _highlights)),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
          SliverToBoxAdapter(child: _LaunchSection(onRegister: () => _openRegister(context), perks: _launchPerks)),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
          SliverToBoxAdapter(child: _CtaSection(onRegister: () => _openRegister(context))),
          SliverToBoxAdapter(child: _LandingFooter()),
        ],
      ),
    );
  }

  void _openLogin(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _openRegister(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
  }
}

class _StickyNavDelegate extends SliverPersistentHeaderDelegate {
  _StickyNavDelegate({required this.child});

  final Widget child;

  @override
  double get minExtent => 64;

  @override
  double get maxExtent => 64;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final colors = context.appColors;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          decoration: BoxDecoration(
            color: colors.background.withValues(alpha: 0.85),
            border: Border(bottom: BorderSide(color: colors.border.withValues(alpha: 0.6))),
          ),
          child: child,
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyNavDelegate oldDelegate) => false;
}

class _LandingNav extends StatelessWidget {
  const _LandingNav({required this.onLogin, required this.onRegister});

  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          const GoalNestLogo(size: GoalNestLogoSize.md),
          const Spacer(),
          const ThemeToggleButton(compact: true),
          const SizedBox(width: 8),
          TextButton(onPressed: onLogin, child: const Text('Sign in')),
          const SizedBox(width: 4),
          FilledButton(
            onPressed: onRegister,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Start free'),
          ),
        ],
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.onLogin, required this.onRegister, required this.isDark});

  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final scheme = Theme.of(context).colorScheme;
    final gradientColors = isDark
        ? [const Color(0x66022422), colors.background, colors.background]
        : [const Color(0xE6ECFDF5), colors.background, colors.background];

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          right: -60,
          top: -20,
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: scheme.primary.withValues(alpha: 0.08),
            ),
          ),
        ),
        Positioned(
          left: -40,
          bottom: 40,
          child: Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accent.withValues(alpha: 0.08),
            ),
          ),
        ),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: gradientColors,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
          child: Column(
            children: [
              if (BillingConfig.launchBadge != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? scheme.primary.withValues(alpha: 0.2) : const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    BillingConfig.launchBadge!,
                    style: TextStyle(
                      color: isDark ? scheme.primary : Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
              Text(
                'Track your money',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 34,
                      height: 1.15,
                      letterSpacing: -0.8,
                    ),
              ),
              ShaderMask(
                shaderCallback: (bounds) => LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF34D399), const Color(0xFF2DD4BF), const Color(0xFF6EE7B7)]
                      : [const Color(0xFF047857), const Color(0xFF0D9488), const Color(0xFF10B981)],
                ).createShader(bounds),
                child: Text(
                  'without the spreadsheet',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 34,
                        height: 1.15,
                        letterSpacing: -0.8,
                        color: Colors.white,
                      ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Salary, rent, EMIs, savings. See what\'s left at the end of the month. Built for how people actually manage money in India.',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.mutedForeground, fontSize: 16, height: 1.5),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onRegister,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: Text(BillingConfig.enabled ? 'Get started' : 'Start free, no card needed'),
                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onLogin,
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('I already have an account'),
                ),
              ),
              if (!BillingConfig.enabled) ...[
                const SizedBox(height: 12),
                Text(
                  BillingConfig.trialMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? scheme.primary : const Color(0xFF047857),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 28),
              Row(
                children: [
                  _QuickChip(icon: Icons.account_balance_wallet_rounded, label: 'Track money'),
                  const SizedBox(width: 8),
                  _QuickChip(icon: Icons.flag_rounded, label: 'Plan goals'),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _QuickChip(icon: Icons.notifications_active_rounded, label: 'Budget alerts'),
                  const SizedBox(width: 8),
                  _QuickChip(icon: Icons.lightbulb_rounded, label: 'Money notes'),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final scheme = Theme.of(context).colorScheme;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: colors.card.withValues(alpha: 0.7),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 18, color: scheme.primary),
            ),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _FeaturesSection extends StatelessWidget {
  const _FeaturesSection({required this.features});

  final List<_Feature> features;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: colors.featureSectionBg,
        border: Border(
          top: BorderSide(color: colors.border.withValues(alpha: 0.8)),
          bottom: BorderSide(color: colors.border.withValues(alpha: 0.8)),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const _SectionLabel('Features'),
            const SizedBox(height: 8),
            Text('All your finances in one app', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Simple tools for tracking, planning, and reporting.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.mutedForeground, height: 1.4),
            ),
            const SizedBox(height: 24),
            ...List.generate((features.length / 2).ceil(), (row) {
              final left = features[row * 2];
              final right = row * 2 + 1 < features.length ? features[row * 2 + 1] : null;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _FeatureCard(feature: left)),
                    const SizedBox(width: 10),
                    Expanded(child: right != null ? _FeatureCard(feature: right) : const SizedBox()),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.feature});

  final _Feature feature;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: colors.border),
        boxShadow: AppTheme.cardShadowFor(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: feature.bgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(feature.icon, color: feature.color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(feature.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 6),
          Text(feature.desc, style: TextStyle(fontSize: 12, color: context.appColors.mutedForeground, height: 1.4)),
        ],
      ),
    );
  }
}

class _WhySection extends StatelessWidget {
  const _WhySection({required this.highlights});

  final List<String> highlights;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel('Why GoalNest'),
          const SizedBox(height: 8),
          Text('Built for Indian salaries and EMIs', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Text(
            'Most apps only show what you spent last month. GoalNest shows what you can spend this month, after rent, bills, and loan payments are accounted for.',
            style: TextStyle(color: colors.mutedForeground, height: 1.5),
          ),
          const SizedBox(height: 20),
          ...highlights.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: scheme.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: scheme.primary.withValues(alpha: 0.15)),
                    ),
                    child: Icon(Icons.check_rounded, size: 16, color: scheme.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text(item, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: colors.card,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(color: colors.border),
              boxShadow: AppTheme.cardShadowFor(context),
            ),
            clipBehavior: Clip.antiAlias,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: scheme.primary),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [scheme.primary.withValues(alpha: 0.06), colors.card],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SAFE TO SPEND',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.2,
                              color: scheme.primary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '₹24,500 left this month after rent, groceries, and your car EMI.',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'That number updates as you log expenses, so you\'re not guessing on payday.',
                            style: TextStyle(color: colors.mutedForeground, height: 1.45, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LaunchSection extends StatelessWidget {
  const _LaunchSection({required this.onRegister, required this.perks});

  final VoidCallback onRegister;
  final List<String> perks;

  @override
  Widget build(BuildContext context) {
    if (BillingConfig.enabled) return const SizedBox.shrink();

    final colors = context.appColors;
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [colors.launchCardStart, colors.launchCardEnd],
          ),
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: colors.launchBorder, width: 1.5),
        ),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: scheme.primary.withValues(alpha: 0.2)),
              ),
              child: Icon(Icons.card_giftcard_rounded, color: scheme.primary, size: 28),
            ),
            const SizedBox(height: 16),
            Text('Free while we launch', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(
                style: TextStyle(color: colors.mutedForeground, height: 1.5, fontSize: 15),
                children: [
                  const TextSpan(text: 'Payments are not live yet. Enjoy '),
                  TextSpan(
                    text: 'full Premium access',
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.w700),
                  ),
                  TextSpan(text: ' for ${BillingConfig.freeTrialDays} days with no credit card.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ...perks.map(
              (perk) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 18, color: scheme.primary),
                    const SizedBox(width: 10),
                    Expanded(child: Text(perk, style: const TextStyle(fontSize: 14))),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onRegister,
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                label: const Text('Create free account'),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'We will announce pricing before anything is charged.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: colors.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}

class _CtaSection extends StatelessWidget {
  const _CtaSection({required this.onRegister});

  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text('Ready to get started?', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Text(
            'Set up takes a few minutes. Add your salary, log a couple of expenses, and you\'re good to go.',
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.mutedForeground, fontSize: 15, height: 1.45),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onRegister,
              icon: const Icon(Icons.arrow_forward_rounded, size: 18),
              label: const Text('Create free account'),
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            ),
          ),
        ],
      ),
    );
  }
}

class _LandingFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 32),
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
      decoration: BoxDecoration(
        color: colors.footerBg,
        border: Border(top: BorderSide(color: colors.border.withValues(alpha: 0.8))),
      ),
      child: Column(
        children: [
          const GoalNestLogo(size: GoalNestLogoSize.sm),
          const SizedBox(height: 12),
          Text(
            '© 2026 GoalNest · Personal finance for India',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: colors.mutedForeground),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.4,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _Feature {
  const _Feature(this.icon, this.title, this.desc, this.color, this.bgColor);

  final IconData icon;
  final String title;
  final String desc;
  final Color color;
  final Color bgColor;
}

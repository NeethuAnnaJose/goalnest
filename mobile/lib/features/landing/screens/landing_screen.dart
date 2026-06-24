import 'package:flutter/material.dart';
import '../../../core/constants/billing_config.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/goalnest_logo.dart';
import '../../auth/screens/login_screen.dart';
import '../../auth/screens/register_screen.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  static const _features = [
    _Feature(Icons.bar_chart_rounded, 'Dashboard', 'Income, expenses, savings, and safe-to-spend in one place.', Color(0xFF10B981), Color(0xFFD1FAE5)),
    _Feature(Icons.flag_rounded, 'Goals', 'Set goals and use planners for house, car, wedding, and more.', Color(0xFF7C3AED), Color(0xFFEDE9FE)),
    _Feature(Icons.shopping_cart_rounded, 'Affordability', 'Check if a purchase fits your budget before you buy.', Color(0xFFE11D48), Color(0xFFFFE4E6)),
    _Feature(Icons.savings_rounded, 'Savings', 'Track bank accounts, FDs, mutual funds, and cash.', Color(0xFF0EA5E9), Color(0xFFE0F2FE)),
    _Feature(Icons.account_balance_rounded, 'Loans', 'Track loans, EMIs, and upcoming payments.', Color(0xFFF59E0B), Color(0xFFFEF3C7)),
    _Feature(Icons.description_rounded, 'Reports', 'Generate and download financial reports.', Color(0xFF64748B), Color(0xFFF1F5F9)),
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

  void _openLogin(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _openRegister(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFECFDF5), AppTheme.surface, AppTheme.surface],
            stops: [0.0, 0.2, 1.0],
          ),
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _LandingNav(onLogin: () => _openLogin(context), onRegister: () => _openRegister(context))),
              SliverToBoxAdapter(child: _HeroSection(onLogin: () => _openLogin(context), onRegister: () => _openRegister(context))),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
              SliverToBoxAdapter(child: _FeaturesSection(features: _features)),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
              SliverToBoxAdapter(child: _WhySection(highlights: _highlights)),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
              SliverToBoxAdapter(child: _LaunchSection(onRegister: () => _openRegister(context), perks: _launchPerks)),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
              SliverToBoxAdapter(child: _CtaSection(onRegister: () => _openRegister(context))),
              const SliverToBoxAdapter(child: _LandingFooter()),
            ],
          ),
        ),
      ),
    );
  }
}

class _LandingNav extends StatelessWidget {
  const _LandingNav({required this.onLogin, required this.onRegister});

  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Row(
        children: [
          const GoalNestLogo(size: GoalNestLogoSize.md),
          const Spacer(),
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
  const _HeroSection({required this.onLogin, required this.onRegister});

  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          right: -60,
          top: -20,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primary.withValues(alpha: 0.08),
            ),
          ),
        ),
        Positioned(
          left: -40,
          bottom: 40,
          child: Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accent.withValues(alpha: 0.08),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
          child: Column(
            children: [
              if (BillingConfig.launchBadge != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    BillingConfig.launchBadge!,
                    style: const TextStyle(
                      color: Colors.white,
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
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [Color(0xFF047857), Color(0xFF0D9488), Color(0xFF10B981)],
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
              const Text(
                'Salary, rent, EMIs, savings. See what\'s left at the end of the month. Built for how people actually manage money in India.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onRegister,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: Text(BillingConfig.enabled ? 'Get started' : 'Start free, no card needed'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onLogin,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppTheme.border),
                  ),
                  child: const Text('I already have an account'),
                ),
              ),
              if (!BillingConfig.enabled) ...[
                const SizedBox(height: 12),
                Text(
                  BillingConfig.trialMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppTheme.primary,
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
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: AppDecorations.card(elevated: false),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: AppDecorations.iconBadge(AppTheme.primary),
              child: Icon(icon, size: 18, color: AppTheme.primary),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: AppTheme.surfaceVariant.withValues(alpha: 0.5),
        border: Border(
          top: BorderSide(color: AppTheme.border.withValues(alpha: 0.8)),
          bottom: BorderSide(color: AppTheme.border.withValues(alpha: 0.8)),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const _SectionLabel('Features'),
            const SizedBox(height: 8),
            Text(
              'All your finances in one app',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Simple tools for tracking, planning, and reporting.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, height: 1.4),
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppDecorations.card(),
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
          Text(
            feature.title,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 6),
          Text(
            feature.desc,
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
          ),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel('Why GoalNest'),
          const SizedBox(height: 8),
          Text(
            'Built for Indian salaries and EMIs',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          const Text(
            'Most apps only show what you spent last month. GoalNest shows what you can spend this month, after rent, bills, and loan payments are accounted for.',
            style: TextStyle(color: AppTheme.textSecondary, height: 1.5),
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
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
                    ),
                    child: const Icon(Icons.check_rounded, size: 16, color: AppTheme.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(item, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            decoration: AppDecorations.card(),
            clipBehavior: Clip.antiAlias,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: AppTheme.primary),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.06),
                            AppTheme.cardBg,
                          ],
                        ),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SAFE TO SPEND',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.2,
                              color: AppTheme.primary,
                            ),
                          ),
                          SizedBox(height: 12),
                          Text(
                            '₹24,500 left this month after rent, groceries, and your car EMI.',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              height: 1.35,
                            ),
                          ),
                          SizedBox(height: 12),
                          Text(
                            'That number updates as you log expenses, so you\'re not guessing on payday.',
                            style: TextStyle(color: AppTheme.textSecondary, height: 1.45, fontSize: 14),
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

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFECFDF5), Color(0xFFF0FDFA)],
          ),
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.primaryLight.withValues(alpha: 0.4), width: 1.5),
          boxShadow: AppTheme.softShadow,
        ),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
              ),
              child: const Icon(Icons.card_giftcard_rounded, color: AppTheme.primary, size: 28),
            ),
            const SizedBox(height: 16),
            Text(
              'Free while we launch',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(
                style: const TextStyle(color: AppTheme.textSecondary, height: 1.5, fontSize: 15),
                children: [
                  const TextSpan(text: 'Payments are not live yet. Enjoy '),
                  TextSpan(
                    text: 'full Premium access',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
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
                    const Icon(Icons.check_circle_rounded, size: 18, color: AppTheme.primary),
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
            const Text(
              'We will announce pricing before anything is charged.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(
            'Ready to get started?',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          const Text(
            'Set up takes a few minutes. Add your salary, log a couple of expenses, and you\'re good to go.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 15, height: 1.45),
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
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 32),
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
      decoration: BoxDecoration(
        color: AppTheme.surfaceVariant.withValues(alpha: 0.4),
        border: Border(top: BorderSide(color: AppTheme.border.withValues(alpha: 0.8))),
      ),
      child: Column(
        children: [
          const GoalNestLogo(size: GoalNestLogoSize.sm),
          const SizedBox(height: 12),
          const Text(
            '© 2026 GoalNest · Personal finance for India',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
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
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.4,
        color: AppTheme.primary,
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

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/navigation/app_nav.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../features/admin/screens/admin_screen.dart';
import '../../features/affordability/screens/affordability_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/expenses/screens/expenses_screen.dart';
import '../../features/goals/screens/goals_screen.dart';
import '../../features/income/screens/income_screen.dart';
import '../../features/loans/screens/loans_screen.dart';
import '../../features/notifications/providers/notifications_provider.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/reports/screens/reports_screen.dart';
import '../../features/savings/screens/savings_screen.dart';
import '../widgets/financial_year_selector.dart';
import '../widgets/goalnest_logo.dart';
import '../widgets/theme_toggle_button.dart';
import '../widgets/trial_banner.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  AppRoute _route = AppRoute.dashboard;

  Widget _screenFor(AppRoute route) {
    return switch (route) {
      AppRoute.dashboard => const DashboardScreen(),
      AppRoute.income => const IncomeScreen(),
      AppRoute.expenses => const ExpensesScreen(),
      AppRoute.savings => const SavingsScreen(),
      AppRoute.goals => const GoalsScreen(),
      AppRoute.loans => const LoansScreen(),
      AppRoute.affordability => const AffordabilityScreen(),
      AppRoute.reports => const ReportsScreen(embedded: true),
      AppRoute.notifications => const NotificationsScreen(embedded: true),
    };
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  bool _isAdmin(Map<String, dynamic>? user) {
    final role = user?['role']?.toString();
    return role == 'ADMIN' || role == 'SUPPORT';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final unreadAsync = ref.watch(unreadCountProvider);
    final firstName = user?['name']?.toString().split(' ').first;
    final colors = context.appColors;
    final unread = unreadAsync.value ?? 0;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: colors.background,
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: const GoalNestLogo(size: GoalNestLogoSize.md),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: FinancialYearSelector(),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    ...mainNavItems.map((item) {
                      final selected = _route == item.route;
                      final isAlerts = item.route == AppRoute.notifications;
                      return ListTile(
                        leading: Icon(
                          item.icon,
                          color: selected ? Theme.of(context).colorScheme.primary : colors.mutedForeground,
                        ),
                        title: Text(
                          item.label,
                          style: TextStyle(
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? Theme.of(context).colorScheme.primary : null,
                          ),
                        ),
                        trailing: isAlerts && unread > 0
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.danger,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  unread > 9 ? '9+' : '$unread',
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                              )
                            : null,
                        selected: selected,
                        selectedTileColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        onTap: () {
                          setState(() => _route = item.route);
                          Navigator.pop(context);
                        },
                      );
                    }),
                    if (_isAdmin(user)) ...[
                      const Divider(),
                      ListTile(
                        leading: Icon(Icons.admin_panel_settings_outlined, color: colors.mutedForeground),
                        title: const Text('Admin'),
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminScreen()));
                        },
                      ),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Row(
                  children: [
                    const ThemeToggleButton(compact: true),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () => ref.read(authProvider.notifier).logout(),
                      icon: const Icon(Icons.logout_rounded, size: 18, color: AppTheme.danger),
                      label: const Text('Sign out', style: TextStyle(color: AppTheme.danger)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          const TrialBanner(),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [colors.heroTint, colors.background],
                  stops: const [0.0, 0.35],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(8, 4, 12, 4),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                            icon: Icon(Icons.menu_rounded, color: colors.mutedForeground),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _greeting(),
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: colors.mutedForeground,
                                        fontWeight: FontWeight.w500,
                                      ),
                                ),
                                Text(
                                  routeTitle(_route),
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                if (firstName != null)
                                  Text(
                                    firstName,
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colors.mutedForeground),
                                  ),
                              ],
                            ),
                          ),
                          if (_route != AppRoute.notifications)
                            unreadAsync.when(
                              loading: () => _headerIcon(Icons.notifications_outlined, () => setState(() => _route = AppRoute.notifications)),
                              error: (_, __) => _headerIcon(Icons.notifications_outlined, () => setState(() => _route = AppRoute.notifications)),
                              data: (count) => Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  _headerIcon(Icons.notifications_outlined, () => setState(() => _route = AppRoute.notifications)),
                                  if (count > 0)
                                    Positioned(
                                      right: 6,
                                      top: 6,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                        decoration: const BoxDecoration(color: AppTheme.danger, shape: BoxShape.circle),
                                        child: Text(
                                          count > 9 ? '9+' : '$count',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    Expanded(child: _screenFor(_route)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerIcon(IconData icon, VoidCallback onTap) {
    final colors = context.appColors;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: colors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.border),
          ),
          child: Icon(icon, size: 22, color: colors.mutedForeground),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/expenses/screens/expenses_screen.dart';
import '../../features/goals/screens/goals_screen.dart';
import '../../features/loans/screens/loans_screen.dart';
import '../../features/notifications/providers/notifications_provider.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/reports/screens/reports_screen.dart';
import '../../features/savings/screens/savings_screen.dart';
import '../widgets/app_decorations.dart';
import '../widgets/theme_toggle_button.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  final _screens = const [
    DashboardScreen(),
    ExpensesScreen(),
    SavingsScreen(),
    GoalsScreen(),
    LoansScreen(),
  ];

  final _titles = ['Overview', 'Spending', 'Savings', 'Goals', 'Loans & EMIs'];

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final unreadAsync = ref.watch(unreadCountProvider);
    final firstName = user?['name']?.toString().split(' ').first;
    final colors = context.appColors;

    return Scaffold(
      backgroundColor: colors.background,
      body: Container(
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
                padding: const EdgeInsets.fromLTRB(20, 8, 12, 4),
                child: Row(
                  children: [
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
                          const SizedBox(height: 2),
                          Text(
                            _titles[_index],
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          if (firstName != null)
                            Text(
                              firstName,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: colors.mutedForeground,
                                  ),
                            ),
                        ],
                      ),
                    ),
                    const ThemeToggleButton(compact: true),
                    const SizedBox(width: 4),
                    unreadAsync.when(
                      loading: () => _iconButton(
                        icon: Icons.notifications_outlined,
                        onPressed: () => _openNotifications(context),
                      ),
                      error: (_, __) => _iconButton(
                        icon: Icons.notifications_outlined,
                        onPressed: () => _openNotifications(context),
                      ),
                      data: (count) => Stack(
                        clipBehavior: Clip.none,
                        children: [
                          _iconButton(
                            icon: Icons.notifications_outlined,
                            onPressed: () => _openNotifications(context),
                          ),
                          if (count > 0)
                            Positioned(
                              right: 6,
                              top: 6,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                                decoration: AppDecorations.unreadBadge(),
                                child: Text(
                                  count > 9 ? '9+' : '$count',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: colors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: colors.border),
                          boxShadow: AppTheme.cardShadowFor(context),
                        ),
                        child: Icon(Icons.more_vert, size: 20, color: colors.mutedForeground),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusMd)),
                      onSelected: (v) {
                        if (v == 'reports') {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsScreen()));
                        } else if (v == 'logout') {
                          ref.read(authProvider.notifier).logout();
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(
                          value: 'reports',
                          child: ListTile(
                            leading: Icon(Icons.description_outlined, color: AppTheme.primary),
                            title: Text('Money Reports'),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        const PopupMenuDivider(),
                        const PopupMenuItem(
                          value: 'logout',
                          child: ListTile(
                            leading: Icon(Icons.logout_rounded, color: AppTheme.danger),
                            title: Text('Sign Out'),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(child: _screens[_index]),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: colors.card,
          border: Border(top: BorderSide(color: colors.border.withValues(alpha: 0.8))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            backgroundColor: Colors.transparent,
            elevation: 0,
            indicatorColor: AppTheme.primary.withValues(alpha: 0.12),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.space_dashboard_outlined),
                selectedIcon: Icon(Icons.space_dashboard_rounded),
                label: 'Overview',
              ),
              NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long_rounded),
                label: 'Spending',
              ),
              NavigationDestination(
                icon: Icon(Icons.savings_outlined),
                selectedIcon: Icon(Icons.savings_rounded),
                label: 'Savings',
              ),
              NavigationDestination(
                icon: Icon(Icons.flag_outlined),
                selectedIcon: Icon(Icons.flag_rounded),
                label: 'Goals',
              ),
              NavigationDestination(
                icon: Icon(Icons.account_balance_outlined),
                selectedIcon: Icon(Icons.account_balance_rounded),
                label: 'Loans',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _iconButton({required IconData icon, required VoidCallback onPressed}) {
    final colors = context.appColors;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: colors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.border),
            boxShadow: AppTheme.cardShadowFor(context),
          ),
          child: Icon(icon, size: 22, color: colors.mutedForeground),
        ),
      ),
    );
  }

  void _openNotifications(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final unreadAsync = ref.watch(unreadCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_titles[_index], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (user != null)
              Text(user['email']?.toString() ?? '', style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.normal)),
          ],
        ),
        actions: [
          unreadAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
            ),
            data: (count) => Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                ),
                if (count > 0)
                  Positioned(
                    right: 8, top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 10)),
                    ),
                  ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'reports') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsScreen()));
              } else if (v == 'logout') {
                ref.read(authProvider.notifier).logout();
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'reports', child: ListTile(leading: Icon(Icons.description), title: Text('Money Reports'), contentPadding: EdgeInsets.zero)),
              const PopupMenuItem(value: 'logout', child: ListTile(leading: Icon(Icons.logout), title: Text('Sign Out'), contentPadding: EdgeInsets.zero)),
            ],
          ),
        ],
      ),
      body: _screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        indicatorColor: AppTheme.primary.withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Overview'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Spending'),
          NavigationDestination(icon: Icon(Icons.savings_outlined), selectedIcon: Icon(Icons.savings), label: 'Savings'),
          NavigationDestination(icon: Icon(Icons.flag_outlined), selectedIcon: Icon(Icons.flag), label: 'Goals'),
          NavigationDestination(icon: Icon(Icons.account_balance_outlined), selectedIcon: Icon(Icons.account_balance), label: 'Loans'),
        ],
      ),
    );
  }
}

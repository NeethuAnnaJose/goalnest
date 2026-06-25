import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/loading_view.dart';

final adminOverviewProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getAdminOverview();
});

class AdminScreen extends ConsumerWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overviewAsync = ref.watch(adminOverviewProvider);
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Admin')),
      body: overviewAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(adminOverviewProvider)),
        data: (data) {
          final users = data['users'] as Map<String, dynamic>? ?? {};
          final subs = data['subscriptions'] as Map<String, dynamic>? ?? {};
          final tickets = data['tickets'] as Map<String, dynamic>? ?? {};

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(adminOverviewProvider),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _StatGrid(colors: colors, items: [
                  _AdminStat('Total users', '${users['total'] ?? 0}', Icons.people_outline),
                  _AdminStat('Active subs', '${subs['active'] ?? 0}', Icons.card_membership_outlined),
                  _AdminStat('Open tickets', '${tickets['open'] ?? 0}', Icons.support_agent_outlined),
                  _AdminStat('New this week', '${users['newThisWeek'] ?? 0}', Icons.person_add_outlined),
                ]),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AppDecorations.card(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Platform overview', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 12),
                      Text(
                        'Revenue (MRR): ₹${data['revenue']?['mrrMajor'] ?? data['revenue']?['mrr'] ?? '0'}',
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Trial users: ${subs['trialing'] ?? 0}',
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AdminStat {
  const _AdminStat(this.label, this.value, this.icon);
  final String label;
  final String value;
  final IconData icon;
}

class _StatGrid extends StatelessWidget {
  const _StatGrid({required this.colors, required this.items});
  final AppColors colors;
  final List<_AdminStat> items;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: items.map((s) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: AppDecorations.card(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(s.icon, color: AppTheme.primary, size: 22),
              const Spacer(),
              Text(s.value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22)),
              Text(s.label, style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
            ],
          ),
        );
      }).toList(),
    );
  }
}

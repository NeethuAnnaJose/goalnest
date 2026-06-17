import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/health_score_ring.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/stat_card.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);
    final breakdownAsync = ref.watch(expenseBreakdownProvider);

    return dashboardAsync.when(
      loading: () => const LoadingView(message: 'Loading dashboard...'),
      error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(dashboardProvider)),
      data: (data) {
        final formatted = data['formatted'] as Map<String, dynamic>? ?? {};
        final health = data['financialHealthScore'] as Map<String, dynamic>? ?? {};
        final goals = data['activeGoals'] as List<dynamic>? ?? [];
        final emis = data['upcomingEmis'] as List<dynamic>? ?? [];

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardProvider);
            ref.invalidate(expenseBreakdownProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Overview', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              StatCard(title: 'Salary', value: '₹${formatted['monthlyIncome'] ?? '0'}', icon: Icons.arrow_upward, color: AppTheme.primaryLight),
              const SizedBox(height: 8),
              StatCard(title: 'Spending', value: '₹${formatted['monthlyExpenses'] ?? '0'}', icon: Icons.arrow_downward, color: Colors.red.shade400),
              const SizedBox(height: 8),
              StatCard(title: 'My Savings', value: '₹${formatted['currentSavings'] ?? '0'}', icon: Icons.savings_outlined),
              const SizedBox(height: 8),
              StatCard(title: 'Safe to Spend', value: '₹${formatted['safeToSpend'] ?? '0'}', icon: Icons.account_balance_wallet_outlined, color: Colors.blue),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      if (health['score'] != null)
                        HealthScoreRing(score: (health['score'] as num).toInt(), grade: health['grade']?.toString() ?? '-'),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Financial Health', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            ...((health['recommendations'] as List<dynamic>? ?? []).take(2).map(
                              (r) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text('• $r', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              ),
                            )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              breakdownAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (breakdown) {
                  if (breakdown.isEmpty) return const SizedBox.shrink();
                  final chartData = breakdown.map((b) {
                    final m = b as Map<String, dynamic>;
                    return _ChartItem(
                      m['category']?.toString().replaceAll('_', ' ') ?? '',
                      MoneyFormatter.format(m['amount']).replaceAll('₹', '').replaceAll(',', '').trim(),
                    );
                  }).toList();
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Where Your Money Goes', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 180,
                            child: BarChart(
                              BarChartData(
                                alignment: BarChartAlignment.spaceAround,
                                maxY: chartData.map((e) => double.tryParse(e.value) ?? 0).reduce((a, b) => a > b ? a : b) * 1.2,
                                barGroups: chartData.asMap().entries.map((entry) {
                                  return BarChartGroupData(
                                    x: entry.key,
                                    barRods: [BarChartRodData(toY: double.tryParse(entry.value.value) ?? 0, color: AppTheme.primary, width: 16, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))],
                                  );
                                }).toList(),
                                titlesData: FlTitlesData(
                                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                                    final i = v.toInt();
                                    if (i >= 0 && i < chartData.length) {
                                      return Padding(padding: const EdgeInsets.only(top: 8), child: Text(chartData[i].label.substring(0, 3), style: const TextStyle(fontSize: 10)));
                                    }
                                    return const Text('');
                                  })),
                                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                ),
                                gridData: const FlGridData(show: false),
                                borderData: FlBorderData(show: false),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              if (goals.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Goals', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...goals.take(3).map((g) {
                  final goal = g as Map<String, dynamic>;
                  final pct = (goal['completionPercent'] as num?)?.toDouble() ?? 0;
                  return Card(
                    child: ListTile(
                      title: Text(goal['name']?.toString() ?? ''),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: LinearProgressIndicator(value: pct / 100, backgroundColor: Colors.grey.shade200, color: AppTheme.primary),
                      ),
                      trailing: Text('${pct.toInt()}%'),
                    ),
                  );
                }),
              ],
              if (emis.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Upcoming EMIs', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...emis.take(3).map((e) {
                  final emi = e as Map<String, dynamic>;
                  final loan = emi['loan'] as Map<String, dynamic>?;
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.payments_outlined, color: AppTheme.primary),
                      title: Text(loan?['name']?.toString() ?? 'EMI'),
                      subtitle: Text(MoneyFormatter.formatDate(emi['dueDate']?.toString() ?? '')),
                      trailing: Text(MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  );
                }),
              ],
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }
}

class _ChartItem {
  _ChartItem(this.label, this.value);
  final String label;
  final String value;
}

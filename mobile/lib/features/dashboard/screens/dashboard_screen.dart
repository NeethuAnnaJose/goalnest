import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/financial_year.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/ai_coach_tips.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/health_score_ring.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/stat_card.dart';
import '../providers/dashboard_provider.dart';
import '../utils/dashboard_money.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  static const _chartColors = [
    AppTheme.primary,
    AppTheme.primaryLight,
    AppTheme.accent,
    AppTheme.info,
    AppTheme.warning,
    Color(0xFF8B5CF6),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);
    final breakdownAsync = ref.watch(expenseBreakdownProvider);

    return dashboardAsync.when(
      loading: () => const LoadingView(message: 'Loading your finances...'),
      error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(dashboardProvider)),
      data: (data) {
        final health = data['financialHealthScore'] as Map<String, dynamic>? ?? {};
        final goals = data['activeGoals'] as List<dynamic>? ?? [];
        final emis = data['upcomingEmis'] as List<dynamic>? ?? [];
        final colors = context.appColors;
        final onCard = Theme.of(context).colorScheme.onSurface;
        final activeMonth = data['activeMonth']?.toString();
        final monthLabel = activeMonth != null ? FinancialYear.formatMonth(activeMonth) : 'This month';
        final safeToSpend = DashboardMoney.amount(data, 'safeToSpend', 'safeToSpend');
        final monthlyIncome = DashboardMoney.amount(data, 'monthlyIncome', 'monthlyIncome');
        final monthlyExpenses = DashboardMoney.amount(data, 'monthlyExpenses', 'monthlyExpenses');
        final currentSavings = DashboardMoney.amount(data, 'currentSavings', 'currentSavings');

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardProvider);
            ref.invalidate(expenseBreakdownProvider);
          },
          color: AppTheme.primary,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: AppDecorations.heroCard(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 22),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            monthLabel,
                            style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Safe to spend',
                      style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      safeToSpend,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Salary',
                      value: monthlyIncome,
                      icon: Icons.trending_up_rounded,
                      color: AppTheme.success,
                      compact: true,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: StatCard(
                      title: 'Spending',
                      value: monthlyExpenses,
                      icon: Icons.trending_down_rounded,
                      color: AppTheme.danger,
                      compact: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'My Savings',
                      value: currentSavings,
                      icon: Icons.savings_rounded,
                      color: AppTheme.primary,
                      compact: true,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: StatCard(
                      title: 'Net Flow',
                      value: safeToSpend,
                      icon: Icons.swap_vert_rounded,
                      color: AppTheme.info,
                      compact: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                decoration: AppDecorations.card(context),
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    if (health['score'] != null)
                      HealthScoreRing(
                        score: (health['score'] as num).toInt(),
                        grade: health['grade']?.toString() ?? '-',
                      ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Financial Health',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(color: onCard),
                          ),
                          const SizedBox(height: 10),
                          ...((health['recommendations'] as List<dynamic>? ?? []).take(2).map(
                            (r) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 6),
                                    width: 5,
                                    height: 5,
                                    decoration: const BoxDecoration(
                                      color: AppTheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '$r',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: colors.mutedForeground,
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const AiCoachTips(),
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
                  final maxY = chartData
                          .map((e) => double.tryParse(e.value) ?? 0)
                          .reduce((a, b) => a > b ? a : b) *
                      1.25;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),
                      const SectionHeader(
                        title: 'Where Your Money Goes',
                        subtitle: 'Spending by category',
                      ),
                      Container(
                        decoration: AppDecorations.card(context),
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                        child: SizedBox(
                          height: 200,
                          child: BarChart(
                            BarChartData(
                              alignment: BarChartAlignment.spaceAround,
                              maxY: maxY,
                              barTouchData: BarTouchData(
                                enabled: true,
                                touchTooltipData: BarTouchTooltipData(
                                  getTooltipColor: (_) => AppTheme.textPrimary,
                                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                    return BarTooltipItem(
                                      '₹${chartData[groupIndex].value}',
                                      const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                    );
                                  },
                                ),
                              ),
                              barGroups: chartData.asMap().entries.map((entry) {
                                final color = _chartColors[entry.key % _chartColors.length];
                                return BarChartGroupData(
                                  x: entry.key,
                                  barRods: [
                                    BarChartRodData(
                                      toY: double.tryParse(entry.value.value) ?? 0,
                                      gradient: LinearGradient(
                                        begin: Alignment.bottomCenter,
                                        end: Alignment.topCenter,
                                        colors: [color.withValues(alpha: 0.7), color],
                                      ),
                                      width: 22,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                                    ),
                                  ],
                                );
                              }).toList(),
                              titlesData: FlTitlesData(
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    getTitlesWidget: (v, _) {
                                      final i = v.toInt();
                                      if (i >= 0 && i < chartData.length) {
                                        final label = chartData[i].label;
                                        final short = label.length > 4 ? label.substring(0, 4) : label;
                                        return Padding(
                                          padding: const EdgeInsets.only(top: 8),
                                          child: Text(
                                            short,
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppTheme.textMuted,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        );
                                      }
                                      return const Text('');
                                    },
                                  ),
                                ),
                                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              ),
                              gridData: FlGridData(
                                show: true,
                                drawVerticalLine: false,
                                horizontalInterval: maxY / 4,
                                getDrawingHorizontalLine: (v) => FlLine(
                                  color: AppTheme.border.withValues(alpha: 0.6),
                                  strokeWidth: 0.5,
                                ),
                              ),
                              borderData: FlBorderData(show: false),
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
              if (goals.isNotEmpty) ...[
                const SizedBox(height: 20),
                const SectionHeader(title: 'Active Goals'),
                ...goals.take(3).map((g) {
                  final goal = g as Map<String, dynamic>;
                  final pct = (goal['completionPercent'] as num?)?.toDouble() ?? 0;
                  return _GoalPreviewCard(name: goal['name']?.toString() ?? '', percent: pct);
                }),
              ],
              if (emis.isNotEmpty) ...[
                const SizedBox(height: 20),
                const SectionHeader(title: 'Upcoming EMIs'),
                ...emis.take(3).map((e) {
                  final emi = e as Map<String, dynamic>;
                  final loan = emi['loan'] as Map<String, dynamic>?;
                  return AppListTile(
                    leadingIcon: Icons.payments_rounded,
                    leadingColor: AppTheme.warning,
                    title: loan?['name']?.toString() ?? 'EMI',
                    subtitle: MoneyFormatter.formatDate(emi['dueDate']?.toString() ?? ''),
                    trailing: Text(
                      MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  );
                }),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _GoalPreviewCard extends StatelessWidget {
  const _GoalPreviewCard({required this.name, required this.percent});

  final String name;
  final double percent;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: AppDecorations.card(context),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.flag_rounded, color: AppTheme.primary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Theme.of(context).colorScheme.onSurface)),
              ),
              Text(
                '${percent.toInt()}%',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percent / 100,
              backgroundColor: context.appColors.muted,
              color: AppTheme.primary,
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartItem {
  _ChartItem(this.label, this.value);
  final String label;
  final String value;
}

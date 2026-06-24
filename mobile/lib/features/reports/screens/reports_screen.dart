import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/reports_provider.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  void _showGenerateDialog(BuildContext context, WidgetRef ref) {
    String period = 'MONTHLY';
    String format = 'PDF';

    showAppBottomSheet(
      context: context,
      title: 'Generate Report',
      subtitle: 'Export your financial summary',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: period,
              decoration: const InputDecoration(labelText: 'Period'),
              items: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              onChanged: (v) => setState(() => period = v ?? 'MONTHLY'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: format,
              decoration: const InputDecoration(labelText: 'Format'),
              items: ['PDF', 'EXCEL', 'CSV']
                  .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                  .toList(),
              onChanged: (v) => setState(() => format = v ?? 'PDF'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).generateReport(period: period, format: format);
                ref.invalidate(reportsProvider);
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Report generated successfully')),
                  );
                }
              },
              child: const Text('Generate'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportsAsync = ref.watch(reportsProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFECFDF5), AppTheme.surface],
            stops: [0.0, 0.25],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.cardBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: const Icon(Icons.arrow_back_rounded, size: 20),
                      ),
                    ),
                    Text('Money Reports', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    FilledButton.tonalIcon(
                      onPressed: () => _showGenerateDialog(context, ref),
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('New'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: reportsAsync.when(
                  loading: () => const LoadingView(),
                  error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(reportsProvider)),
                  data: (reports) {
                    if (reports.isEmpty) {
                      return const EmptyView(
                        message: 'No reports yet.\nTap New to generate one.',
                        icon: Icons.description_outlined,
                      );
                    }
                    return RefreshIndicator(
                      onRefresh: () async => ref.invalidate(reportsProvider),
                      color: AppTheme.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                        itemCount: reports.length,
                        itemBuilder: (_, i) {
                          final report = reports[i] as Map<String, dynamic>;
                          final metadata = report['metadata'] as Map<String, dynamic>?;
                          final summary = metadata?['summary'] as Map<String, dynamic>?;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: AppDecorations.card(),
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: AppDecorations.iconBadge(AppTheme.primary),
                                  child: const Icon(Icons.description_rounded, color: AppTheme.primary),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${report['period']} Report',
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${report['format']} · ${MoneyFormatter.formatDate(report['startDate']?.toString() ?? '')} – ${MoneyFormatter.formatDate(report['endDate']?.toString() ?? '')}',
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                      ),
                                      if (summary != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            _SummaryChip(
                                              label: 'Income',
                                              value: '₹${summary['totalIncome']}',
                                              color: AppTheme.success,
                                            ),
                                            const SizedBox(width: 8),
                                            _SummaryChip(
                                              label: 'Expenses',
                                              value: '₹${summary['totalExpenses']}',
                                              color: AppTheme.danger,
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$label $value',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

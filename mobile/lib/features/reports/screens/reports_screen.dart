import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/reports_provider.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  void _showGenerateDialog(BuildContext context, WidgetRef ref) {
    String period = 'MONTHLY';
    String format = 'PDF';

    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Generate Report', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: period,
              decoration: const InputDecoration(labelText: 'Period'),
              items: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              onChanged: (v) => period = v ?? 'MONTHLY',
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: format,
              decoration: const InputDecoration(labelText: 'Format'),
              items: ['PDF', 'EXCEL', 'CSV']
                  .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                  .toList(),
              onChanged: (v) => format = v ?? 'PDF',
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).generateReport(period: period, format: format);
                ref.invalidate(reportsProvider);
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Report generated')));
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
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
      appBar: AppBar(
        title: const Text('Money Reports'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showGenerateDialog(context, ref)),
        ],
      ),
      body: reportsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(reportsProvider)),
        data: (reports) {
          if (reports.isEmpty) {
            return EmptyView(
              message: 'No reports yet.\nTap + to generate one.',
              icon: Icons.description_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(reportsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: reports.length,
              itemBuilder: (_, i) {
                final report = reports[i] as Map<String, dynamic>;
                final metadata = report['metadata'] as Map<String, dynamic>?;
                final summary = metadata?['summary'] as Map<String, dynamic>?;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                      child: const Icon(Icons.description, color: AppTheme.primary),
                    ),
                    title: Text('${report['period']} Report'),
                    subtitle: Text(
                      '${report['format']} · ${MoneyFormatter.formatDate(report['startDate']?.toString() ?? '')} to ${MoneyFormatter.formatDate(report['endDate']?.toString() ?? '')}'
                      '${summary != null ? '\nIncome: ₹${summary['totalIncome']} · Expenses: ₹${summary['totalExpenses']}' : ''}',
                    ),
                    isThreeLine: summary != null,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

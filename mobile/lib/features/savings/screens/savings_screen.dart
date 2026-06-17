import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/stat_card.dart';
import '../providers/savings_provider.dart';

class SavingsScreen extends ConsumerWidget {
  const SavingsScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final balanceController = TextEditingController();
    String type = 'BANK';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Add Savings Account', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: ['BANK', 'CASH', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => type = v ?? 'BANK',
            ),
            const SizedBox(height: 12),
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Account Name')),
            const SizedBox(height: 12),
            TextField(controller: balanceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Balance (₹)')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).createSavings({
                  'type': type,
                  'name': nameController.text,
                  'balance': balanceController.text,
                });
                ref.invalidate(savingsProvider);
                ref.invalidate(savingsGrowthProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
              child: const Text('Create'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savingsAsync = ref.watch(savingsProvider);
    final growthAsync = ref.watch(savingsGrowthProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _showAddDialog(context, ref), child: const Icon(Icons.add)),
      body: savingsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(savingsProvider)),
        data: (accounts) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(savingsProvider);
              ref.invalidate(savingsGrowthProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                growthAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (growth) {
                    final f = growth['formatted'] as Map<String, dynamic>? ?? {};
                    return Column(
                      children: [
                        StatCard(title: 'Total Balance', value: '₹${f['totalBalance'] ?? '0'}', icon: Icons.account_balance),
                        const SizedBox(height: 8),
                        StatCard(title: 'Monthly Growth', value: '₹${f['monthlySavingsGrowth'] ?? '0'}', icon: Icons.trending_up, color: AppTheme.primaryLight),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
                if (accounts.isEmpty)
                  const EmptyView(message: 'No savings accounts yet', icon: Icons.savings_outlined)
                else
                  ...accounts.map((a) {
                    final acc = a as Map<String, dynamic>;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                          child: const Icon(Icons.savings, color: AppTheme.primary),
                        ),
                        title: Text(acc['name']?.toString() ?? ''),
                        subtitle: Text(acc['type']?.toString().replaceAll('_', ' ') ?? ''),
                        trailing: Text(MoneyFormatter.format(acc['balance']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
      ),
    );
  }
}

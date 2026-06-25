import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_list_tile.dart';
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

    showAppBottomSheet(
      context: context,
      title: 'Add Savings Account',
      subtitle: 'Track your growing wealth',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: ['BANK', 'CASH', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => type = v ?? 'BANK'),
            ),
            const SizedBox(height: 12),
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Account Name')),
            const SizedBox(height: 12),
            TextField(controller: balanceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Balance (₹)', prefixText: '₹ ')),
            const SizedBox(height: 20),
            FilledButton(
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
              child: const Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAccountActions(BuildContext context, WidgetRef ref, Map<String, dynamic> acc) {
    final id = acc['id'].toString();
    final depositController = TextEditingController();
    final nameController = TextEditingController(text: acc['name']?.toString() ?? '');

    showAppBottomSheet(
      context: context,
      title: acc['name']?.toString() ?? 'Account',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: depositController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Deposit amount (₹)', prefixText: '₹ ')),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).depositSavings(id, depositController.text);
              ref.invalidate(savingsProvider);
              ref.invalidate(savingsGrowthProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Deposit'),
          ),
          const SizedBox(height: 16),
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Rename account')),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).updateSavings(id, {'name': nameController.text});
              ref.invalidate(savingsProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Save name'),
          ),
          TextButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).deleteSavings(id);
              ref.invalidate(savingsProvider);
              ref.invalidate(savingsGrowthProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Delete account', style: TextStyle(color: AppTheme.danger)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savingsAsync = ref.watch(savingsProvider);
    final growthAsync = ref.watch(savingsGrowthProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context, ref),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: savingsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(savingsProvider)),
        data: (accounts) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(savingsProvider);
              ref.invalidate(savingsGrowthProvider);
              ref.invalidate(savingsContributionsProvider);
            },
            color: AppTheme.primary,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 88),
              children: [
                growthAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (growth) {
                    final f = growth['formatted'] as Map<String, dynamic>? ?? {};
                    return Column(
                      children: [
                        StatCard(title: 'Total Balance', value: '₹${f['totalBalance'] ?? '0'}', icon: Icons.account_balance_rounded, color: AppTheme.primary),
                        const SizedBox(height: 10),
                        StatCard(title: 'Monthly Growth', value: '₹${f['monthlySavingsGrowth'] ?? '0'}', icon: Icons.trending_up_rounded, color: AppTheme.success),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
                if (accounts.isEmpty)
                  const EmptyView(message: 'No savings accounts yet.\nTap + to create one.', icon: Icons.savings_outlined)
                else
                  ...accounts.map((a) {
                    final acc = a as Map<String, dynamic>;
                    return AppListTile(
                      leadingIcon: Icons.savings_rounded,
                      leadingColor: AppTheme.success,
                      title: acc['name']?.toString() ?? '',
                      subtitle: '${acc['type']?.toString().replaceAll('_', ' ')} · Tap to deposit or edit',
                      onTap: () => _showAccountActions(context, ref, acc),
                      trailing: Text(
                        MoneyFormatter.format(acc['balance']),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppTheme.primary),
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

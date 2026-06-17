import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/expenses_provider.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String category = 'FOOD';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Add Expense', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: ['FOOD', 'RENT', 'UTILITIES', 'SHOPPING', 'TRAVEL', 'ENTERTAINMENT', 'HEALTHCARE', 'TRANSPORTATION', 'OTHER']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => category = v ?? 'FOOD',
            ),
            const SizedBox(height: 12),
            TextField(controller: amountController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)')),
            const SizedBox(height: 12),
            TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).createExpense({
                  'category': category,
                  'amount': amountController.text,
                  'date': DateTime.now().toIso8601String().split('T')[0],
                  'description': descController.text,
                });
                ref.invalidate(expensesProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
              child: const Text('Save'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expensesAsync = ref.watch(expensesProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: expensesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(expensesProvider)),
        data: (expenses) {
          if (expenses.isEmpty) return const EmptyView(message: 'No expenses this month', icon: Icons.receipt_long_outlined);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(expensesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: expenses.length,
              itemBuilder: (_, i) {
                final exp = expenses[i] as Map<String, dynamic>;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                      child: const Icon(Icons.receipt, color: AppTheme.primary, size: 20),
                    ),
                    title: Text(exp['description']?.toString() ?? exp['category']?.toString().replaceAll('_', ' ') ?? 'Expense'),
                    subtitle: Text('${exp['category']?.toString().replaceAll('_', ' ')} · ${MoneyFormatter.formatDate(exp['date']?.toString() ?? '')}'),
                    trailing: Text(MoneyFormatter.format(exp['amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
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

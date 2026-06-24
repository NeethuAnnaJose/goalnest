import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/expenses_provider.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  static const _categories = [
    'FOOD', 'RENT', 'UTILITIES', 'SHOPPING', 'TRAVEL',
    'ENTERTAINMENT', 'HEALTHCARE', 'TRANSPORTATION', 'OTHER',
  ];

  static IconData _categoryIcon(String cat) {
    switch (cat) {
      case 'FOOD': return Icons.restaurant_rounded;
      case 'RENT': return Icons.home_rounded;
      case 'UTILITIES': return Icons.bolt_rounded;
      case 'SHOPPING': return Icons.shopping_bag_rounded;
      case 'TRAVEL': return Icons.flight_rounded;
      case 'ENTERTAINMENT': return Icons.movie_rounded;
      case 'HEALTHCARE': return Icons.medical_services_rounded;
      case 'TRANSPORTATION': return Icons.directions_car_rounded;
      default: return Icons.receipt_long_rounded;
    }
  }

  static Color _categoryColor(String cat) {
    switch (cat) {
      case 'FOOD': return const Color(0xFFF97316);
      case 'RENT': return AppTheme.info;
      case 'UTILITIES': return AppTheme.warning;
      case 'SHOPPING': return const Color(0xFF8B5CF6);
      case 'TRAVEL': return AppTheme.accent;
      case 'ENTERTAINMENT': return const Color(0xFFEC4899);
      case 'HEALTHCARE': return AppTheme.danger;
      case 'TRANSPORTATION': return const Color(0xFF6366F1);
      default: return AppTheme.textSecondary;
    }
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String category = 'FOOD';

    showAppBottomSheet(
      context: context,
      title: 'Add Expense',
      subtitle: 'Track where your money goes',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => category = v ?? 'FOOD'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
            ),
            const SizedBox(height: 12),
            TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 20),
            FilledButton(
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
              child: const Text('Save Expense'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expensesAsync = ref.watch(expensesProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context, ref),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: expensesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(expensesProvider)),
        data: (expenses) {
          if (expenses.isEmpty) {
            return const EmptyView(message: 'No expenses this month.\nTap + to add your first one.', icon: Icons.receipt_long_outlined);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(expensesProvider),
            color: AppTheme.primary,
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 88),
              itemCount: expenses.length,
              itemBuilder: (_, i) {
                final exp = expenses[i] as Map<String, dynamic>;
                final cat = exp['category']?.toString() ?? 'OTHER';
                return AppListTile(
                  leadingIcon: _categoryIcon(cat),
                  leadingColor: _categoryColor(cat),
                  title: exp['description']?.toString() ?? cat.replaceAll('_', ' '),
                  subtitle: '${cat.replaceAll('_', ' ')} · ${MoneyFormatter.formatDate(exp['date']?.toString() ?? '')}',
                  trailing: Text(
                    MoneyFormatter.format(exp['amount']),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.danger),
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

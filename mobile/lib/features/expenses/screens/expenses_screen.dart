import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/expenses_provider.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  static const _categories = [
    'FOOD', 'RENT', 'UTILITIES', 'SHOPPING', 'TRAVEL',
    'ENTERTAINMENT', 'HEALTHCARE', 'TRANSPORTATION', 'OTHER',
  ];

  late String _month;
  final _searchController = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _month = ref.read(activeMonthProvider);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  ExpensesFilter get _filter => ExpensesFilter(month: _month, search: _search.isEmpty ? null : _search);

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

  void _showForm({Map<String, dynamic>? existing}) {
    final amountController = TextEditingController(text: existing != null ? _amountMajor(existing) : '');
    final descController = TextEditingController(text: existing?['description']?.toString() ?? '');
    final dateController = TextEditingController(text: existing?['date']?.toString().split('T').first ?? DateTime.now().toIso8601String().split('T').first);
    String category = existing?['category']?.toString() ?? 'FOOD';

    showAppBottomSheet(
      context: context,
      title: existing == null ? 'Add Expense' : 'Edit Expense',
      subtitle: 'Track where your money goes',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => category = v ?? 'FOOD'),
            ),
            const SizedBox(height: 12),
            TextField(controller: amountController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ ')),
            const SizedBox(height: 12),
            TextField(controller: dateController, decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)')),
            const SizedBox(height: 12),
            TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                final payload = {
                  'category': category,
                  'amount': amountController.text,
                  'date': dateController.text,
                  'description': descController.text,
                };
                if (existing != null) {
                  await ref.read(apiServiceProvider).updateExpense(existing['id'].toString(), payload);
                } else {
                  await ref.read(apiServiceProvider).createExpense(payload);
                }
                ref.invalidate(expensesProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: Text(existing == null ? 'Save Expense' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }

  String _amountMajor(Map<String, dynamic> exp) {
    if (exp['amountMajor'] != null) return exp['amountMajor'].toString();
    final amt = exp['amount'];
    if (amt is num && amt >= 10000) return (amt / 100).toString();
    return amt?.toString() ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final fy = ref.watch(selectedFyProvider);
    final months = FinancialYear.monthsInYear(fy);
    final expensesAsync = ref.watch(expensesProvider(_filter));

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search expenses…',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () {
                        _searchController.clear();
                        setState(() => _search = '');
                      })
                    : null,
                isDense: true,
              ),
              onSubmitted: (v) => setState(() => _search = v.trim()),
              onChanged: (v) { if (v.isEmpty) setState(() => _search = ''); },
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Row(
              children: months.map((m) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(FinancialYear.formatMonth(m)),
                    selected: m == _month,
                    onSelected: (_) => setState(() => _month = m),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: expensesAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(expensesProvider(_filter))),
              data: (expenses) {
                if (expenses.isEmpty) {
                  return const EmptyView(message: 'No expenses this month.\nTap + to add your first one.', icon: Icons.receipt_long_outlined);
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(expensesProvider(_filter)),
                  color: AppTheme.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 88),
                    itemCount: expenses.length,
                    itemBuilder: (_, i) {
                      final exp = expenses[i] as Map<String, dynamic>;
                      final cat = exp['category']?.toString() ?? 'OTHER';
                      return AppListTile(
                        leadingIcon: _categoryIcon(cat),
                        leadingColor: _categoryColor(cat),
                        title: exp['description']?.toString() ?? cat.replaceAll('_', ' '),
                        subtitle: '${cat.replaceAll('_', ' ')} · ${MoneyFormatter.formatDate(exp['date']?.toString() ?? '')}',
                        onTap: () => _showForm(existing: exp),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(MoneyFormatter.format(exp['amount']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.danger)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: AppTheme.danger, size: 20),
                              onPressed: () async {
                                await ref.read(apiServiceProvider).deleteExpense(exp['id'].toString());
                                ref.invalidate(expensesProvider);
                              },
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
    );
  }
}

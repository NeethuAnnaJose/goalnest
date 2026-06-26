import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/expenses_provider.dart';
import '../utils/budget_utils.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  late String _month = '';
  final _searchController = TextEditingController();
  String _search = '';
  final Map<String, String> _localBudgetLimits = {};
  bool _savingBudgets = false;

  @override
  void initState() {
    super.initState();
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
      case 'EDUCATION': return Icons.school_rounded;
      case 'INSURANCE': return Icons.shield_rounded;
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

  Map<String, String> _savedBudgets(Map<String, dynamic>? profile) {
    final prefs = profile?['financialPreferences'] as Map<String, dynamic>?;
    final raw = prefs?['categoryBudgets'] as Map<String, dynamic>? ?? {};
    return raw.map((k, v) => MapEntry(k, v.toString()));
  }

  List<String> _hiddenCategories(Map<String, dynamic>? profile) {
    final prefs = profile?['financialPreferences'] as Map<String, dynamic>?;
    return (prefs?['hiddenTrackerCategories'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
  }

  List<String> _customTrackerCategories(Map<String, dynamic>? profile) {
    final prefs = profile?['financialPreferences'] as Map<String, dynamic>?;
    return (prefs?['customTrackerCategories'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
  }

  Map<String, String> _effectiveBudgets(Map<String, dynamic>? profile) {
    return {..._savedBudgets(profile), ..._localBudgetLimits};
  }

  bool _hasBudgetChanges(Map<String, dynamic>? profile) {
    final saved = _savedBudgets(profile);
    for (final entry in _localBudgetLimits.entries) {
      if (entry.value != (saved[entry.key] ?? '')) return true;
    }
    return false;
  }

  String _limitDisplayValue(String key, Map<String, dynamic>? profile) {
    if (_localBudgetLimits.containsKey(key)) return _localBudgetLimits[key] ?? '';
    return _savedBudgets(profile)[key] ?? '';
  }

  Future<void> _saveBudgets(Map<String, dynamic>? profile) async {
    setState(() => _savingBudgets = true);
    try {
      final prefs = profile?['financialPreferences'] as Map<String, dynamic>? ?? {};
      final cleaned = cleanCategoryBudgets(_effectiveBudgets(profile));
      await ref.read(apiServiceProvider).updateProfile({
        'financialPreferences': {...prefs, 'categoryBudgets': cleaned},
      });
      setState(() => _localBudgetLimits.clear());
      ref.invalidate(profileProvider);
      await ref.read(authProvider.notifier).refreshProfile();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Limits saved')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _savingBudgets = false);
    }
  }

  void _showSetLimitSheet({String? category, String? customName}) {
    final limitController = TextEditingController();
    String cat = category ?? 'FOOD';
    final nameController = TextEditingController(text: customName ?? '');

    showAppBottomSheet(
      context: context,
      title: 'Set budget limit',
      subtitle: 'Monthly spending cap for a category',
      child: StatefulBuilder(
        builder: (ctx, setLocal) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: cat,
              decoration: const InputDecoration(labelText: 'Category'),
              items: expenseCategories
                  .map((c) => DropdownMenuItem(value: c, child: Text(formatCategoryLabel(c))))
                  .toList(),
              onChanged: (v) => setLocal(() => cat = v ?? 'FOOD'),
            ),
            if (cat == 'OTHER') ...[
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Custom category name'),
              ),
            ],
            const SizedBox(height: 12),
            TextField(
              controller: limitController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Monthly limit (₹)', prefixText: '₹ '),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                final key = cat == 'OTHER' ? customBudgetKey(nameController.text.trim()) : cat;
                if (cat == 'OTHER' && nameController.text.trim().isEmpty) return;
                setState(() => _localBudgetLimits[key] = limitController.text.trim());
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Set limit'),
            ),
          ],
        ),
      ),
    );
  }

  void _showExpenseForm({Map<String, dynamic>? existing}) {
    final amountController = TextEditingController(text: existing != null ? _amountMajor(existing) : '');
    final descController = TextEditingController(text: existing?['description']?.toString() ?? '');
    final dateController = TextEditingController(
      text: existing?['date']?.toString().split('T').first ?? DateTime.now().toIso8601String().split('T').first,
    );
    String category = existing?['category']?.toString() ?? 'FOOD';
    final profile = ref.read(profileProvider).valueOrNull;

    showAppBottomSheet(
      context: context,
      title: existing == null ? 'Add Expense' : 'Edit Expense',
      subtitle: 'Track where your money goes',
      child: StatefulBuilder(
        builder: (ctx, setLocal) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: expenseCategories
                  .map((c) => DropdownMenuItem(value: c, child: Text(formatCategoryLabel(c))))
                  .toList(),
              onChanged: (v) => setLocal(() => category = v ?? 'FOOD'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dateController,
              decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: InputDecoration(
                labelText: category == 'OTHER' ? 'Name (required)' : 'Description',
              ),
            ),
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
                  final result = await ref.read(apiServiceProvider).createExpense(payload);
                  _handleExpenseCreateResult(
                    result,
                    category,
                    descController.text.trim(),
                    amountController.text,
                    profile,
                  );
                }
                ref.invalidate(expensesProvider);
                ref.invalidate(expenseBreakdownMonthProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: Text(existing == null ? 'Save Expense' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleExpenseCreateResult(
    Map<String, dynamic> result,
    String category,
    String description,
    String amount,
    Map<String, dynamic>? profile,
  ) {
    final budgetAlert = result['budgetAlert'] as Map<String, dynamic>?;
    if (budgetAlert != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(budgetAlert['body']?.toString() ?? 'Budget limit exceeded'),
          backgroundColor: AppTheme.danger,
          duration: const Duration(seconds: 6),
        ),
      );
      return;
    }

    final budgetKey = category == 'OTHER' ? customBudgetKey(description) : category;
    final limit = double.tryParse(_effectiveBudgets(profile)[budgetKey] ?? '') ?? 0;
    if (limit > 0 && mounted) {
      final added = double.tryParse(amount) ?? 0;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('₹$added added to ${formatCategoryLabel(category)}')),
      );
    }
  }

  String _amountMajor(Map<String, dynamic> exp) {
    if (exp['amountMajor'] != null) return exp['amountMajor'].toString();
    final amt = exp['amount'];
    if (amt is num && amt >= 10000) return (amt / 100).toString();
    return amt?.toString() ?? '';
  }

  List<_TrackerRow> _trackerRows(
    Map<String, dynamic>? profile,
    List<dynamic> expenses,
  ) {
    final hidden = _hiddenCategories(profile);
    final rows = <_TrackerRow>[];
    for (final cat in expenseCategories) {
      if (cat == 'OTHER') continue;
      if (!hidden.contains(cat)) rows.add(_TrackerRow.standard(cat));
    }
    final names = <String>{..._customTrackerCategories(profile)};
    for (final exp in expenses) {
      final m = exp as Map<String, dynamic>;
      if (m['category']?.toString() != 'OTHER') continue;
      final name = (m['description']?.toString() ?? '').trim();
      if (name.isNotEmpty) names.add(name);
    }
    for (final name in names) {
      final key = customBudgetKey(name);
      if (!hidden.contains(key)) rows.add(_TrackerRow.custom(name));
    }
    return rows;
  }

  Map<String, double> _monthlySpentByCategory(List<dynamic> breakdown) {
    final map = <String, double>{};
    for (final item in breakdown) {
      final m = item as Map<String, dynamic>;
      map[m['category']?.toString() ?? ''] = expenseAmountMajor(m['amount']);
    }
    return map;
  }

  Map<String, double> _customMonthlySpent(List<dynamic> expenses) {
    final map = <String, double>{};
    for (final exp in expenses) {
      final m = exp as Map<String, dynamic>;
      if (m['category']?.toString() != 'OTHER') continue;
      final name = (m['description']?.toString() ?? '').trim();
      if (name.isEmpty) continue;
      final key = customBudgetKey(name);
      map[key] = (map[key] ?? 0) + expenseAmountMajor(m['amount']);
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final fy = ref.watch(selectedFyProvider);
    if (_month.isEmpty) {
      _month = ref.watch(activeMonthProvider);
    }
    final months = FinancialYear.monthsInYear(fy);
    final expensesAsync = ref.watch(expensesProvider(_filter));
    final breakdownAsync = ref.watch(expenseBreakdownMonthProvider(_month));
    final profileAsync = ref.watch(profileProvider);
    final profile = profileAsync.valueOrNull;
    final colors = context.appColors;
    final hasChanges = _hasBudgetChanges(profile);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.small(
            heroTag: 'set_limit',
            onPressed: () => _showSetLimitSheet(),
            child: const Icon(Icons.speed_rounded),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'add_expense',
            onPressed: () => _showExpenseForm(),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Add'),
          ),
        ],
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
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _search = '');
                        },
                      )
                    : null,
                isDense: true,
              ),
              onSubmitted: (v) => setState(() => _search = v.trim()),
              onChanged: (v) {
                if (v.isEmpty) setState(() => _search = '');
              },
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
              error: (e, _) => ErrorView(
                message: e.toString(),
                onRetry: () {
                  ref.invalidate(expensesProvider(_filter));
                  ref.invalidate(expenseBreakdownMonthProvider(_month));
                },
              ),
              data: (expenses) {
                final breakdown = breakdownAsync.valueOrNull ?? [];
                final monthlySpent = _monthlySpentByCategory(breakdown);
                final customSpent = _customMonthlySpent(expenses);
                final budgets = _effectiveBudgets(profile);
                final trackerRows = _trackerRows(profile, expenses);

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(expensesProvider(_filter));
                    ref.invalidate(expenseBreakdownMonthProvider(_month));
                    ref.invalidate(profileProvider);
                  },
                  color: AppTheme.primary,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    children: [
                      Row(
                        children: [
                          const Text('Budget tracker', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          const Spacer(),
                          if (hasChanges)
                            TextButton.icon(
                              onPressed: _savingBudgets ? null : () => _saveBudgets(profile),
                              icon: _savingBudgets
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Icon(Icons.save_outlined, size: 18),
                              label: const Text('Save limits'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...trackerRows.map((row) {
                        final budgetKey = row.kind == 'standard' ? row.category! : customBudgetKey(row.name!);
                        final label = row.kind == 'standard'
                            ? formatCategoryLabel(row.category!)
                            : row.name!;
                        final spent = row.kind == 'standard'
                            ? (monthlySpent[row.category!] ?? 0)
                            : (customSpent[budgetKey] ?? 0);
                        final status = getBudgetStatus(budgetKey, budgets, spent);

                        return _BudgetTrackerRow(
                          budgetKey: budgetKey,
                          label: label,
                          limitValue: _limitDisplayValue(budgetKey, profile),
                          spent: spent,
                          status: status,
                          colors: colors,
                          onLimitChanged: (v) => setState(() => _localBudgetLimits[budgetKey] = v),
                        );
                      }),
                      const SizedBox(height: 20),
                      const Text('Transactions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 8),
                      if (expenses.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: EmptyView(
                            message: 'No expenses this month.\nTap + to add your first one.',
                            icon: Icons.receipt_long_outlined,
                          ),
                        )
                      else
                        ...expenses.map((e) {
                          final exp = e as Map<String, dynamic>;
                          final cat = exp['category']?.toString() ?? 'OTHER';
                          return AppListTile(
                            leadingIcon: _categoryIcon(cat),
                            leadingColor: _categoryColor(cat),
                            title: exp['description']?.toString() ?? formatCategoryLabel(cat),
                            subtitle:
                                '${formatCategoryLabel(cat)} · ${MoneyFormatter.formatDate(exp['date']?.toString() ?? '')}',
                            onTap: () => _showExpenseForm(existing: exp),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  MoneyFormatter.format(exp['amount']),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    color: AppTheme.danger,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.danger, size: 20),
                                  onPressed: () async {
                                    await ref.read(apiServiceProvider).deleteExpense(exp['id'].toString());
                                    ref.invalidate(expensesProvider);
                                    ref.invalidate(expenseBreakdownMonthProvider);
                                  },
                                ),
                              ],
                            ),
                          );
                        }),
                    ],
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

class _TrackerRow {
  const _TrackerRow._({required this.kind, this.category, this.name});
  factory _TrackerRow.standard(String category) => _TrackerRow._(kind: 'standard', category: category);
  factory _TrackerRow.custom(String name) => _TrackerRow._(kind: 'custom', name: name);

  final String kind;
  final String? category;
  final String? name;
}

class _BudgetTrackerRow extends StatelessWidget {
  const _BudgetTrackerRow({
    required this.budgetKey,
    required this.label,
    required this.limitValue,
    required this.spent,
    required this.status,
    required this.colors,
    required this.onLimitChanged,
  });

  final String budgetKey;
  final String label;
  final String limitValue;
  final double spent;
  final BudgetStatus status;
  final AppColors colors;
  final ValueChanged<String> onLimitChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppDecorations.card(
        color: status.exceeded ? AppTheme.danger.withValues(alpha: 0.06) : null,
        elevated: !status.exceeded,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ),
              if (status.exceeded)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.danger.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 14, color: AppTheme.danger),
                      SizedBox(width: 4),
                      Text('Exceeded', style: TextStyle(color: AppTheme.danger, fontSize: 11, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _BudgetLimitField(
                  key: ValueKey(budgetKey),
                  value: limitValue,
                  onChanged: onLimitChanged,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Spent', style: TextStyle(fontSize: 11, color: colors.mutedForeground)),
                    Text(
                      '₹${spent.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: status.exceeded ? AppTheme.danger : null,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Left', style: TextStyle(fontSize: 11, color: colors.mutedForeground)),
                    Text(
                      status.remaining != null ? '₹${status.remaining!.toStringAsFixed(0)}' : '-',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: status.remaining != null && status.remaining! < 0 ? AppTheme.danger : AppTheme.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (status.limit > 0) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: status.percent / 100,
                minHeight: 6,
                backgroundColor: colors.muted.withValues(alpha: 0.4),
                color: status.exceeded ? AppTheme.danger : AppTheme.primary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BudgetLimitField extends StatefulWidget {
  const _BudgetLimitField({super.key, required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  State<_BudgetLimitField> createState() => _BudgetLimitFieldState();
}

class _BudgetLimitFieldState extends State<_BudgetLimitField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(covariant _BudgetLimitField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value && widget.value != _controller.text) {
      _controller.text = widget.value;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: TextInputType.number,
      decoration: const InputDecoration(
        isDense: true,
        labelText: 'Limit',
        prefixText: '₹ ',
      ),
      onChanged: widget.onChanged,
    );
  }
}

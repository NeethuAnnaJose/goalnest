import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/income_provider.dart';

class IncomeScreen extends ConsumerStatefulWidget {
  const IncomeScreen({super.key});

  @override
  ConsumerState<IncomeScreen> createState() => _IncomeScreenState();
}

class _IncomeScreenState extends ConsumerState<IncomeScreen> {
  static const _types = ['SALARY', 'FREELANCE', 'RENTAL', 'BUSINESS', 'OTHER'];
  late String _month;

  @override
  void initState() {
    super.initState();
    _month = ref.read(activeMonthProvider);
  }

  void _showForm({Map<String, dynamic>? existing}) {
    final amountController = TextEditingController(text: existing != null ? _amountMajor(existing) : '');
    final notesController = TextEditingController(text: existing?['notes']?.toString() ?? existing?['category']?.toString() ?? '');
    final dateController = TextEditingController(text: existing?['date']?.toString().split('T').first ?? DateTime.now().toIso8601String().split('T').first);
    String type = existing?['type']?.toString() ?? 'SALARY';

    showAppBottomSheet(
      context: context,
      title: existing == null ? 'Add income' : 'Edit income',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => type = v ?? 'SALARY'),
            ),
            const SizedBox(height: 12),
            TextField(controller: amountController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ ')),
            const SizedBox(height: 12),
            TextField(controller: dateController, decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)')),
            const SizedBox(height: 12),
            TextField(controller: notesController, decoration: const InputDecoration(labelText: 'Notes')),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                final payload = {
                  'type': type,
                  'amount': amountController.text,
                  'date': dateController.text,
                  if (notesController.text.isNotEmpty) 'notes': notesController.text,
                  if (type == 'SALARY') 'isRecurring': true,
                  if (type == 'SALARY') 'frequency': 'MONTHLY',
                };
                if (existing != null) {
                  await ref.read(apiServiceProvider).updateIncome(existing['id'].toString(), payload);
                } else {
                  await ref.read(apiServiceProvider).createIncome(payload);
                }
                ref.invalidate(incomeProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: Text(existing == null ? 'Add income' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }

  String _amountMajor(Map<String, dynamic> inc) {
    if (inc['amountMajor'] != null) return inc['amountMajor'].toString();
    final amt = inc['amount'];
    if (amt is num && amt >= 10000) return (amt / 100).toString();
    return amt?.toString() ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final fy = ref.watch(selectedFyProvider);
    final months = FinancialYear.monthsInYear(fy);
    final incomeAsync = ref.watch(incomeProvider(_month));

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Row(
              children: months.map((m) {
                final selected = m == _month;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(FinancialYear.formatMonth(m)),
                    selected: selected,
                    onSelected: (_) => setState(() => _month = m),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: incomeAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(incomeProvider(_month))),
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyView(message: 'No income for this month.\nTap + to add salary or other income.', icon: Icons.arrow_circle_up_outlined);
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(incomeProvider(_month)),
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 88),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final inc = items[i] as Map<String, dynamic>;
                      return AppListTile(
                        leadingIcon: Icons.arrow_circle_up_rounded,
                        leadingColor: AppTheme.success,
                        title: inc['type']?.toString().replaceAll('_', ' ') ?? 'Income',
                        subtitle: '${MoneyFormatter.formatDate(inc['date']?.toString() ?? '')}${inc['notes'] != null ? ' · ${inc['notes']}' : ''}',
                        onTap: () => _showForm(existing: inc),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(MoneyFormatter.format(inc['amount']), style: const TextStyle(fontWeight: FontWeight.w700)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: AppTheme.danger, size: 20),
                              onPressed: () async {
                                await ref.read(apiServiceProvider).deleteIncome(inc['id'].toString());
                                ref.invalidate(incomeProvider(_month));
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

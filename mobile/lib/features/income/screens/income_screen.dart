import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../features/dashboard/providers/dashboard_provider.dart';
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
  String? _month;

  String _activeMonth(WidgetRef ref) {
    return _month ?? ref.watch(activeMonthProvider);
  }

  void _showForm({Map<String, dynamic>? existing}) {
    final month = _activeMonth(ref);
    final amountController = TextEditingController(text: existing != null ? _amountMajor(existing) : '');
    final notesController = TextEditingController(text: existing?['notes']?.toString() ?? existing?['category']?.toString() ?? '');
    final dateController = TextEditingController(
      text: existing?['date']?.toString().split('T').first ?? FinancialYear.defaultDateForMonth(month),
    );
    String type = existing?['type']?.toString() ?? 'SALARY';
    var saving = false;

    showAppBottomSheet(
      context: context,
      title: existing == null ? 'Add income' : 'Edit income',
      subtitle: existing == null ? 'Salary is saved for ${FinancialYear.formatMonth(month)}' : null,
      child: StatefulBuilder(
        builder: (ctx, setLocal) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' ')))).toList(),
              onChanged: saving ? null : (v) => setLocal(() => type = v ?? 'SALARY'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
              enabled: !saving,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dateController,
              decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)'),
              enabled: !saving,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(labelText: 'Notes'),
              enabled: !saving,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: saving
                  ? null
                  : () async {
                      final amount = amountController.text.trim();
                      if (amount.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Enter an amount'), backgroundColor: AppTheme.danger),
                        );
                        return;
                      }
                      setLocal(() => saving = true);
                      try {
                        final payload = {
                          'type': type,
                          'amount': amount,
                          'date': dateController.text.trim(),
                          if (notesController.text.trim().isNotEmpty) 'notes': notesController.text.trim(),
                          if (type == 'SALARY') 'isRecurring': true,
                          if (type == 'SALARY') 'frequency': 'MONTHLY',
                        };
                        if (existing != null) {
                          await ref.read(apiServiceProvider).updateIncome(existing['id'].toString(), payload);
                        } else {
                          await ref.read(apiServiceProvider).createIncome(payload);
                        }
                        ref.invalidate(incomeProvider(month));
                        ref.invalidate(dashboardProvider);
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(existing == null ? 'Income added' : 'Income updated')),
                          );
                        }
                      } on DioException catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(ref.read(apiClientProvider).getErrorMessage(e)),
                              backgroundColor: AppTheme.danger,
                            ),
                          );
                        }
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
                          );
                        }
                      } finally {
                        if (ctx.mounted) setLocal(() => saving = false);
                      }
                    },
              child: saving
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : Text(existing == null ? 'Add income' : 'Save changes'),
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
    final month = _activeMonth(ref);
    final months = FinancialYear.monthsInYear(fy);
    final incomeAsync = ref.watch(incomeProvider(month));

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
                final selected = m == month;
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
              error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(incomeProvider(month))),
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyView(
                    message: 'No income for this month.\nTap + to add salary or other income.',
                    icon: Icons.arrow_circle_up_outlined,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(incomeProvider(month));
                    ref.invalidate(dashboardProvider);
                  },
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
                                try {
                                  await ref.read(apiServiceProvider).deleteIncome(inc['id'].toString());
                                  ref.invalidate(incomeProvider(month));
                                  ref.invalidate(dashboardProvider);
                                } on DioException catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(ref.read(apiClientProvider).getErrorMessage(e)),
                                        backgroundColor: AppTheme.danger,
                                      ),
                                    );
                                  }
                                }
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

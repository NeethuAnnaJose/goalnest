import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_list_tile.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/section_header.dart';
import '../providers/loans_provider.dart';

class LoansScreen extends ConsumerWidget {
  const LoansScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final principalController = TextEditingController();
    final rateController = TextEditingController(text: '8.5');
    final tenureController = TextEditingController(text: '240');
    String type = 'HOME';

    showAppBottomSheet(
      context: context,
      title: 'Add Loan',
      subtitle: 'Track EMIs and remaining balance',
      isScrollControlled: true,
      child: StatefulBuilder(
        builder: (ctx, setState) => SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: ['HOME', 'PERSONAL', 'VEHICLE', 'EDUCATION', 'CREDIT_CARD']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                    .toList(),
                onChanged: (v) => setState(() => type = v ?? 'HOME'),
              ),
              const SizedBox(height: 12),
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Loan Name')),
              const SizedBox(height: 12),
              TextField(
                controller: principalController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Principal (₹)', prefixText: '₹ '),
              ),
              const SizedBox(height: 12),
              TextField(controller: rateController, decoration: const InputDecoration(labelText: 'Interest Rate (%)', suffixText: '%')),
              const SizedBox(height: 12),
              TextField(
                controller: tenureController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Tenure (months)'),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () async {
                  await ref.read(apiServiceProvider).createLoan({
                    'type': type,
                    'name': nameController.text,
                    'principal': principalController.text,
                    'interestRate': rateController.text,
                    'tenureMonths': int.tryParse(tenureController.text) ?? 240,
                    'startDate': DateTime.now().toIso8601String().split('T')[0],
                  });
                  ref.invalidate(loansProvider);
                  ref.invalidate(upcomingEmisProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                child: const Text('Create Loan'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(loansProvider);
    final emisAsync = ref.watch(upcomingEmisProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context, ref),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: loansAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(loansProvider)),
        data: (loans) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(loansProvider);
              ref.invalidate(upcomingEmisProvider);
            },
            color: AppTheme.primary,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 88),
              children: [
                if (emisAsync.hasValue && (emisAsync.value ?? []).isNotEmpty) ...[
                  const SectionHeader(title: 'Upcoming EMIs', subtitle: 'Due soon'),
                  ...(emisAsync.value ?? []).map((e) {
                    final emi = e as Map<String, dynamic>;
                    final loan = emi['loan'] as Map<String, dynamic>?;
                    return AppListTile(
                      leadingIcon: Icons.schedule_rounded,
                      leadingColor: AppTheme.warning,
                      title: loan?['name']?.toString() ?? 'EMI',
                      subtitle: 'Due ${MoneyFormatter.formatDate(emi['dueDate']?.toString() ?? '')}',
                      highlightColor: AppTheme.warning.withValues(alpha: 0.08),
                      trailing: Text(
                        MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    );
                  }),
                  const SizedBox(height: 12),
                ],
                const SectionHeader(title: 'Your Loans'),
                if (loans.isEmpty)
                  const EmptyView(message: 'No loans tracked yet.\nTap + to add one.', icon: Icons.account_balance_outlined)
                else
                  ...loans.map((l) {
                    final loan = l as Map<String, dynamic>;
                    return AppListTile(
                      leadingIcon: Icons.account_balance_rounded,
                      leadingColor: AppTheme.primary,
                      title: loan['name']?.toString() ?? '',
                      subtitle: 'EMI ${loan['emiAmountMajor'] ?? MoneyFormatter.format(loan['emiAmount'])}/mo · ${loan['type']?.toString().replaceAll('_', ' ')}',
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Remaining', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                          Text(
                            MoneyFormatter.format(loan['remainingBalance']),
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
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
    );
  }
}

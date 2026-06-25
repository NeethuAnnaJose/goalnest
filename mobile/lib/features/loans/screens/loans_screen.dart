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
import '../../../shared/widgets/stat_card.dart';
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
              TextField(controller: principalController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Principal (₹)', prefixText: '₹ ')),
              const SizedBox(height: 12),
              TextField(controller: rateController, decoration: const InputDecoration(labelText: 'Interest Rate (%)', suffixText: '%')),
              const SizedBox(height: 12),
              TextField(controller: tenureController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Tenure (months)')),
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
                  ref.invalidate(emiSummaryProvider);
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

  void _showEmiTracker(BuildContext context, WidgetRef ref, Map<String, dynamic> loan) {
    final loanId = loan['id'].toString();
    showAppBottomSheet(
      context: context,
      title: loan['name']?.toString() ?? 'EMI tracker',
      subtitle: 'Tap a month to mark paid or unpaid',
      isScrollControlled: true,
      child: Consumer(
        builder: (ctx, ref, _) {
          final trackerAsync = ref.watch(emiTrackerProvider(loanId));
          return trackerAsync.when(
            loading: () => const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
            error: (e, _) => Text(e.toString()),
            data: (tracker) {
              final emis = tracker['emis'] as List<dynamic>? ?? [];
              return SizedBox(
                height: 360,
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.4),
                  itemCount: emis.length,
                  itemBuilder: (_, i) {
                    final emi = emis[i] as Map<String, dynamic>;
                    final status = emi['status']?.toString() ?? 'PENDING';
                    final color = switch (status) {
                      'PAID' => AppTheme.success,
                      'MISSED' => AppTheme.danger,
                      'OVERDUE' => AppTheme.warning,
                      _ => AppTheme.textMuted,
                    };
                    return InkWell(
                      onTap: () async {
                        final id = emi['id'].toString();
                        if (status == 'PAID') {
                          await ref.read(apiServiceProvider).unpayEmi(id);
                        } else {
                          await ref.read(apiServiceProvider).payEmi(id, DateTime.now().toIso8601String().split('T').first);
                        }
                        ref.invalidate(emiTrackerProvider(loanId));
                        ref.invalidate(upcomingEmisProvider);
                        ref.invalidate(emiSummaryProvider);
                      },
                      onLongPress: () async {
                        if (status != 'PAID') {
                          await ref.read(apiServiceProvider).markEmiMissed(emi['id'].toString());
                          ref.invalidate(emiTrackerProvider(loanId));
                        }
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: color.withValues(alpha: 0.4)),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('EMI ${emi['installmentNumber'] ?? i + 1}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
                            const SizedBox(height: 4),
                            Text(MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _editLoan(BuildContext context, WidgetRef ref, Map<String, dynamic> loan) {
    final nameController = TextEditingController(text: loan['name']?.toString() ?? '');
    showAppBottomSheet(
      context: context,
      title: 'Edit loan',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).updateLoan(loan['id'].toString(), {'name': nameController.text});
              ref.invalidate(loansProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
          TextButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).deleteLoan(loan['id'].toString());
              ref.invalidate(loansProvider);
              ref.invalidate(upcomingEmisProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Delete loan', style: TextStyle(color: AppTheme.danger)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(loansProvider);
    final emisAsync = ref.watch(upcomingEmisProvider);
    final summaryAsync = ref.watch(emiSummaryProvider);

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
              ref.invalidate(emiSummaryProvider);
            },
            color: AppTheme.primary,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 88),
              children: [
                summaryAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (summary) {
                    final f = summary['formatted'] as Map<String, dynamic>? ?? {};
                    return Column(
                      children: [
                        StatCard(title: 'EMIs this FY', value: '₹${f['totalPaid'] ?? '0'}', icon: Icons.payments_rounded, color: AppTheme.success, compact: true),
                        const SizedBox(height: 10),
                        StatCard(title: 'Remaining EMIs', value: '${summary['remainingCount'] ?? 0}', icon: Icons.schedule_rounded, color: AppTheme.warning, compact: true),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
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
                      trailing: Text(MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
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
                      subtitle: 'EMI ${loan['emiAmountMajor'] ?? MoneyFormatter.format(loan['emiAmount'])}/mo · Tap for tracker',
                      onTap: () => _showEmiTracker(context, ref, loan),
                      onLongPress: () => _editLoan(context, ref, loan),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Remaining', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                          Text(MoneyFormatter.format(loan['remainingBalance']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
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

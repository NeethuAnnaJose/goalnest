import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/loans_provider.dart';

class LoansScreen extends ConsumerWidget {
  const LoansScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final principalController = TextEditingController();
    final rateController = TextEditingController(text: '8.5');
    final tenureController = TextEditingController(text: '240');
    String type = 'HOME';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Add Loan', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: ['HOME', 'PERSONAL', 'VEHICLE', 'EDUCATION', 'CREDIT_CARD']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                    .toList(),
                onChanged: (v) => type = v ?? 'HOME',
              ),
              const SizedBox(height: 12),
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Loan Name')),
              const SizedBox(height: 12),
              TextField(controller: principalController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Principal (₹)')),
              const SizedBox(height: 12),
              TextField(controller: rateController, decoration: const InputDecoration(labelText: 'Interest Rate (%)')),
              const SizedBox(height: 12),
              TextField(controller: tenureController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Tenure (months)')),
              const SizedBox(height: 16),
              ElevatedButton(
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
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
                child: const Text('Create Loan'),
              ),
              const SizedBox(height: 24),
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
      floatingActionButton: FloatingActionButton(onPressed: () => _showAddDialog(context, ref), child: const Icon(Icons.add)),
      body: loansAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(loansProvider)),
        data: (loans) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(loansProvider);
              ref.invalidate(upcomingEmisProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (emisAsync.hasValue && (emisAsync.value ?? []).isNotEmpty) ...[
                  Text('Upcoming EMIs', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...(emisAsync.value ?? []).map((e) {
                    final emi = e as Map<String, dynamic>;
                    final loan = emi['loan'] as Map<String, dynamic>?;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: Colors.amber.shade50,
                      child: ListTile(
                        leading: const Icon(Icons.schedule, color: Colors.amber),
                        title: Text(loan?['name']?.toString() ?? 'EMI'),
                        subtitle: Text('Due: ${MoneyFormatter.formatDate(emi['dueDate']?.toString() ?? '')}'),
                        trailing: Text(MoneyFormatter.format(emi['amountMajor'] ?? emi['amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  }),
                  const SizedBox(height: 16),
                ],
                Text('Your Loans', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (loans.isEmpty)
                  const EmptyView(message: 'No loans tracked yet', icon: Icons.account_balance_outlined)
                else
                  ...loans.map((l) {
                    final loan = l as Map<String, dynamic>;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                          child: const Icon(Icons.account_balance, color: AppTheme.primary),
                        ),
                        title: Text(loan['name']?.toString() ?? ''),
                        subtitle: Text('EMI: ${loan['emiAmountMajor'] ?? MoneyFormatter.format(loan['emiAmount'])}/mo · ${loan['type']?.toString().replaceAll('_', ' ')}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Remaining', style: TextStyle(fontSize: 10, color: Colors.grey)),
                            Text(MoneyFormatter.format(loan['remainingBalance']), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
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

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/goals_provider.dart';

class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final targetController = TextEditingController();
    String type = 'HOUSE';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('New Goal', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: ['HOUSE', 'CAR', 'WEDDING', 'VACATION', 'EDUCATION', 'EMERGENCY_FUND', 'CUSTOM']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => type = v ?? 'HOUSE',
            ),
            const SizedBox(height: 12),
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Goal Name')),
            const SizedBox(height: 12),
            TextField(controller: targetController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Target Amount (₹)')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).createGoal({
                  'type': type,
                  'name': nameController.text,
                  'targetAmount': targetController.text,
                });
                ref.invalidate(goalsProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
              child: const Text('Create Goal'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(goalsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _showAddDialog(context, ref), child: const Icon(Icons.add)),
      body: goalsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(goalsProvider)),
        data: (goals) {
          if (goals.isEmpty) return const EmptyView(message: 'No goals yet. Create your first goal!', icon: Icons.flag_outlined);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(goalsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: goals.length,
              itemBuilder: (_, i) {
                final goal = goals[i] as Map<String, dynamic>;
                final pct = (goal['completionPercent'] as num?)?.toDouble() ?? 0;
                final isCompleted = goal['isCompleted'] == true;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.flag, color: isCompleted ? AppTheme.primaryLight : AppTheme.primary),
                            const SizedBox(width: 8),
                            Expanded(child: Text(goal['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                            if (isCompleted) Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: AppTheme.primaryLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                              child: const Text('Done', style: TextStyle(color: AppTheme.primary, fontSize: 12)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        LinearProgressIndicator(value: pct / 100, backgroundColor: Colors.grey.shade200, color: AppTheme.primary, minHeight: 8, borderRadius: BorderRadius.circular(4)),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${goal['currentSavingsMajor'] ?? MoneyFormatter.format(goal['currentSavings'])}'),
                            Text('${goal['targetAmountMajor'] ?? MoneyFormatter.format(goal['targetAmount'])}'),
                          ],
                        ),
                        Text('${pct.toInt()}% complete', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        if (!isCompleted) ...[
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () async {
                              final amount = await _promptAmount(context);
                              if (amount != null) {
                                await ref.read(apiServiceProvider).addGoalProgress(goal['id'].toString(), amount);
                                ref.invalidate(goalsProvider);
                              }
                            },
                            child: const Text('Add Progress'),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<String?> _promptAmount(BuildContext context) async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Savings'),
        content: TextField(controller: controller, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Add')),
        ],
      ),
    );
  }
}

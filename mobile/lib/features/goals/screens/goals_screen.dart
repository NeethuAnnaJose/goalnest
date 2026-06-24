import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/goals_provider.dart';

class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final targetController = TextEditingController();
    String type = 'HOUSE';

    showAppBottomSheet(
      context: context,
      title: 'New Goal',
      subtitle: 'Set a target and track your progress',
      child: StatefulBuilder(
        builder: (ctx, setState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: ['HOUSE', 'CAR', 'WEDDING', 'VACATION', 'EDUCATION', 'EMERGENCY_FUND', 'CUSTOM']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => type = v ?? 'HOUSE'),
            ),
            const SizedBox(height: 12),
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Goal Name')),
            const SizedBox(height: 12),
            TextField(
              controller: targetController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Target Amount (₹)', prefixText: '₹ '),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                await ref.read(apiServiceProvider).createGoal({
                  'type': type,
                  'name': nameController.text,
                  'targetAmount': targetController.text,
                });
                ref.invalidate(goalsProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Create Goal'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(goalsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context, ref),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add'),
      ),
      body: goalsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(goalsProvider)),
        data: (goals) {
          if (goals.isEmpty) {
            return const EmptyView(
              message: 'No goals yet.\nCreate your first savings goal!',
              icon: Icons.flag_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(goalsProvider),
            color: AppTheme.primary,
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 88),
              itemCount: goals.length,
              itemBuilder: (_, i) {
                final goal = goals[i] as Map<String, dynamic>;
                final pct = (goal['completionPercent'] as num?)?.toDouble() ?? 0;
                final isCompleted = goal['isCompleted'] == true;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: AppDecorations.card(),
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: AppDecorations.iconBadge(
                              isCompleted ? AppTheme.success : AppTheme.primary,
                            ),
                            child: Icon(
                              isCompleted ? Icons.check_rounded : Icons.flag_rounded,
                              color: isCompleted ? AppTheme.success : AppTheme.primary,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              goal['name']?.toString() ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                            ),
                          ),
                          if (isCompleted)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                gradient: AppTheme.cardAccentGradient,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'Done',
                                style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            )
                          else
                            Text(
                              '${pct.toInt()}%',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                                fontSize: 16,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: pct / 100,
                          backgroundColor: AppTheme.surfaceVariant,
                          color: isCompleted ? AppTheme.success : AppTheme.primary,
                          minHeight: 10,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${goal['currentSavingsMajor'] ?? MoneyFormatter.format(goal['currentSavings'])}',
                            style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                          ),
                          Text(
                            '${goal['targetAmountMajor'] ?? MoneyFormatter.format(goal['targetAmount'])}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      if (!isCompleted) ...[
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton.icon(
                            onPressed: () async {
                              final amount = await _promptAmount(context);
                              if (amount != null) {
                                await ref.read(apiServiceProvider).addGoalProgress(goal['id'].toString(), amount);
                                ref.invalidate(goalsProvider);
                              }
                            },
                            icon: const Icon(Icons.add_circle_outline, size: 18),
                            label: const Text('Add Progress'),
                          ),
                        ),
                      ],
                    ],
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusMd)),
        title: const Text('Add Savings'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Add')),
        ],
      ),
    );
  }
}

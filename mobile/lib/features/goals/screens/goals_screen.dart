import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/goals_provider.dart';

class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  String _plannerType = 'HOUSE';
  Map<String, dynamic>? _plannerResult;
  bool _plannerLoading = false;

  static const _plannerTypes = [
    ('HOUSE', Icons.home_rounded),
    ('CAR', Icons.directions_car_rounded),
    ('WEDDING', Icons.favorite_rounded),
    ('VACATION', Icons.flight_rounded),
    ('EDUCATION', Icons.school_rounded),
    ('EMERGENCY_FUND', Icons.shield_rounded),
    ('CUSTOM', Icons.flag_rounded),
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _showAddDialog() {
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
              items: _plannerTypes.map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$1.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => type = v ?? 'HOUSE'),
            ),
            const SizedBox(height: 12),
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Goal Name')),
            const SizedBox(height: 12),
            TextField(controller: targetController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Target Amount (₹)', prefixText: '₹ ')),
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

  Future<void> _runPlanner() async {
    final priceController = TextEditingController(text: '5000000');
    final downController = TextEditingController(text: '20');
    final rateController = TextEditingController(text: '8.5');
    final paymentController = TextEditingController(text: '50000');

    await showAppBottomSheet(
      context: context,
      title: '${_plannerType.replaceAll('_', ' ')} planner',
      subtitle: 'Estimate timeline and loan options',
      isScrollControlled: true,
      child: StatefulBuilder(
        builder: (ctx, setLocal) => SingleChildScrollView(
          child: Column(
            children: [
              TextField(controller: priceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Target amount (₹)', prefixText: '₹ ')),
              const SizedBox(height: 12),
              TextField(controller: downController, decoration: const InputDecoration(labelText: 'Down payment (%)', suffixText: '%')),
              const SizedBox(height: 12),
              TextField(controller: rateController, decoration: const InputDecoration(labelText: 'Interest rate (%)', suffixText: '%')),
              const SizedBox(height: 12),
              TextField(controller: paymentController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Monthly payment (₹)', prefixText: '₹ ')),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () async {
                  setState(() => _plannerLoading = true);
                  try {
                    final result = await ref.read(apiServiceProvider).housePlanner(
                      propertyPrice: priceController.text,
                      downPaymentPercent: downController.text,
                      interestRate: rateController.text,
                      monthlyPayment: paymentController.text,
                    );
                    setState(() => _plannerResult = result);
                    if (ctx.mounted) Navigator.pop(ctx);
                  } finally {
                    if (mounted) setState(() => _plannerLoading = false);
                  }
                },
                child: const Text('Calculate'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<String?> _promptAmount() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusMd)),
        title: const Text('Add Savings'),
        content: TextField(controller: controller, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ ')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Add')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final goalsAsync = ref.watch(goalsProvider);
    final colors = context.appColors;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: _tabs.index == 0
          ? FloatingActionButton.extended(onPressed: _showAddDialog, icon: const Icon(Icons.add_rounded), label: const Text('Add'))
          : null,
      body: Column(
        children: [
          TabBar(
            controller: _tabs,
            onTap: (_) => setState(() {}),
            tabs: const [Tab(text: 'My goals'), Tab(text: 'Planners')],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                goalsAsync.when(
                  loading: () => const LoadingView(),
                  error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(goalsProvider)),
                  data: (goals) {
                    if (goals.isEmpty) {
                      return const EmptyView(message: 'No goals yet.\nCreate your first savings goal!', icon: Icons.flag_outlined);
                    }
                    return RefreshIndicator(
                      onRefresh: () async => ref.invalidate(goalsProvider),
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 88),
                        itemCount: goals.length,
                        itemBuilder: (_, i) => _GoalCard(
                          goal: goals[i] as Map<String, dynamic>,
                          onAddProgress: (id) async {
                            final amount = await _promptAmount();
                            if (amount != null) {
                              await ref.read(apiServiceProvider).addGoalProgress(id, amount);
                              ref.invalidate(goalsProvider);
                            }
                          },
                          onEdit: (goal) => _editGoal(goal),
                          onDelete: (id) async {
                            await ref.read(apiServiceProvider).deleteGoal(id);
                            ref.invalidate(goalsProvider);
                          },
                        ),
                      ),
                    );
                  },
                ),
                _PlannersTab(
                  plannerType: _plannerType,
                  plannerTypes: _plannerTypes,
                  plannerResult: _plannerResult,
                  loading: _plannerLoading,
                  colors: colors,
                  onTypeChanged: (t) => setState(() { _plannerType = t; _plannerResult = null; }),
                  onCalculate: _runPlanner,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _editGoal(Map<String, dynamic> goal) {
    final nameController = TextEditingController(text: goal['name']?.toString() ?? '');
    final targetController = TextEditingController(text: goal['targetAmountMajor']?.toString() ?? goal['targetAmount']?.toString() ?? '');
    showAppBottomSheet(
      context: context,
      title: 'Edit goal',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: 12),
          TextField(controller: targetController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Target (₹)', prefixText: '₹ ')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).updateGoal(goal['id'].toString(), {
                'name': nameController.text,
                'targetAmount': targetController.text,
              });
              ref.invalidate(goalsProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.goal, required this.onAddProgress, required this.onEdit, required this.onDelete});
  final Map<String, dynamic> goal;
  final Future<void> Function(String id) onAddProgress;
  final void Function(Map<String, dynamic> goal) onEdit;
  final Future<void> Function(String id) onDelete;

  @override
  Widget build(BuildContext context) {
    final pct = (goal['completionPercent'] as num?)?.toDouble() ?? 0;
    final isCompleted = goal['isCompleted'] == true;
    final id = goal['id'].toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppDecorations.card(context),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: AppDecorations.iconBadge(isCompleted ? AppTheme.success : AppTheme.primary),
                child: Icon(isCompleted ? Icons.check_rounded : Icons.flag_rounded, color: isCompleted ? AppTheme.success : AppTheme.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(goal['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
              IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => onEdit(goal)),
              IconButton(icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.danger), onPressed: () => onDelete(id)),
              if (isCompleted)
                Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(gradient: AppTheme.cardAccentGradient, borderRadius: BorderRadius.circular(20)), child: const Text('Done', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)))
              else
                Text('${pct.toInt()}%', style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primary, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(borderRadius: BorderRadius.circular(6), child: LinearProgressIndicator(value: pct / 100, backgroundColor: AppTheme.surfaceVariant, color: isCompleted ? AppTheme.success : AppTheme.primary, minHeight: 10)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${goal['currentSavingsMajor'] ?? MoneyFormatter.format(goal['currentSavings'])}', style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
              Text('${goal['targetAmountMajor'] ?? MoneyFormatter.format(goal['targetAmount'])}', style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          if (!isCompleted)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(onPressed: () => onAddProgress(id), icon: const Icon(Icons.add_circle_outline, size: 18), label: const Text('Add Progress')),
            ),
        ],
      ),
    );
  }
}

class _PlannersTab extends StatelessWidget {
  const _PlannersTab({
    required this.plannerType,
    required this.plannerTypes,
    required this.plannerResult,
    required this.loading,
    required this.colors,
    required this.onTypeChanged,
    required this.onCalculate,
  });

  final String plannerType;
  final List<(String, IconData)> plannerTypes;
  final Map<String, dynamic>? plannerResult;
  final bool loading;
  final AppColors colors;
  final ValueChanged<String> onTypeChanged;
  final VoidCallback onCalculate;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      children: [
        Text('Plan big purchases with loan and savings estimates', style: TextStyle(color: colors.mutedForeground)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: plannerTypes.map((t) {
            final selected = t.$1 == plannerType;
            return FilterChip(
              avatar: Icon(t.$2, size: 16),
              label: Text(t.$1.replaceAll('_', ' ')),
              selected: selected,
              onSelected: (_) => onTypeChanged(t.$1),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: loading ? null : onCalculate,
          icon: loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.calculate_outlined),
          label: const Text('Open planner calculator'),
        ),
        if (plannerResult != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: AppDecorations.card(context),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Planner result', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 12),
                if (plannerResult!['monthsToSave'] != null) Text('Months to save: ${plannerResult!['monthsToSave']}'),
                if (plannerResult!['loanAmountMajor'] != null) Text('Loan amount: ₹${plannerResult!['loanAmountMajor']}'),
                if (plannerResult!['emiMajor'] != null) Text('Estimated EMI: ₹${plannerResult!['emiMajor']}/mo'),
                if (plannerResult!['recommendation'] != null) ...[
                  const SizedBox(height: 8),
                  Text(plannerResult!['recommendation'].toString(), style: TextStyle(color: colors.mutedForeground, height: 1.4)),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

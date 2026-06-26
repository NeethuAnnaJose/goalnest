const expenseCategories = [
  'FOOD', 'RENT', 'UTILITIES', 'SHOPPING', 'TRAVEL', 'ENTERTAINMENT',
  'HEALTHCARE', 'EDUCATION', 'TRANSPORTATION', 'INSURANCE', 'OTHER',
];

String formatCategoryLabel(String category) {
  return category.split('_').map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ');
}

String customBudgetKey(String name) => 'OTHER:${name.toLowerCase()}';

double expenseAmountMajor(dynamic amount) {
  if (amount == null) return 0;
  if (amount is num) return amount >= 10000 ? amount / 100 : amount.toDouble();
  return double.tryParse(amount.toString()) ?? 0;
}

Map<String, String> cleanCategoryBudgets(Map<String, String> budgets) {
  return Map.fromEntries(
    budgets.entries.where((e) {
      final v = e.value.trim();
      if (v.isEmpty) return false;
      return (double.tryParse(v) ?? 0) > 0;
    }),
  );
}

class BudgetStatus {
  const BudgetStatus({
    required this.limit,
    required this.spent,
    required this.remaining,
    required this.percent,
    required this.exceeded,
  });

  final double limit;
  final double spent;
  final double? remaining;
  final double percent;
  final bool exceeded;
}

BudgetStatus getBudgetStatus(String? budgetKey, Map<String, String> budgets, double spent) {
  if (budgetKey == null) {
    return const BudgetStatus(limit: 0, spent: 0, remaining: null, percent: 0, exceeded: false);
  }
  final limit = double.tryParse(budgets[budgetKey] ?? '') ?? 0;
  if (limit <= 0) {
    return BudgetStatus(limit: 0, spent: spent, remaining: null, percent: 0, exceeded: false);
  }
  final remaining = limit - spent;
  final percent = ((spent / limit) * 100).clamp(0, 100).toDouble();
  return BudgetStatus(
    limit: limit,
    spent: spent,
    remaining: remaining,
    percent: percent,
    exceeded: spent > limit,
  );
}

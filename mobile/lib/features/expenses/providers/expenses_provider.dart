import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

class ExpensesFilter {
  const ExpensesFilter({required this.month, this.search, this.category});

  final String month;
  final String? search;
  final String? category;
}

final expensesProvider = FutureProvider.family<List<dynamic>, ExpensesFilter>((ref, filter) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getExpenses(
    month: filter.month,
    fy: fy,
    search: filter.search,
    category: filter.category,
  );
});

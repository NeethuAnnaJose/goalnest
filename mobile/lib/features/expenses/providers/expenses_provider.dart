import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/utils/money_formatter.dart';

final expensesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getExpenses(month: MoneyFormatter.currentMonth());
});

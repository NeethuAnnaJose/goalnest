import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/utils/money_formatter.dart';

final dashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getDashboard();
});

final expenseBreakdownProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getExpenseBreakdown(MoneyFormatter.currentMonth());
});

final healthScoreProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getHealthScore();
});

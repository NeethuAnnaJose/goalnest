import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

final dashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getDashboard(fy: fy);
});

final expenseBreakdownProvider = FutureProvider<List<dynamic>>((ref) async {
  final fy = ref.watch(selectedFyProvider);
  final month = ref.watch(activeMonthProvider);
  return ref.read(apiServiceProvider).getExpenseBreakdown(month: month, fy: fy);
});

final healthScoreProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getHealthScore();
});

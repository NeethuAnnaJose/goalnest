import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

final savingsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getSavings();
});

final savingsGrowthProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getSavingsGrowth(fy: fy);
});

final savingsContributionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getSavingsContributions(fy: fy);
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

final incomeProvider = FutureProvider.family<List<dynamic>, String>((ref, month) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getIncome(month: month, fy: fy);
});

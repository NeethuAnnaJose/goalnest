import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

final savingsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getSavings();
});

final savingsGrowthProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getSavingsGrowth();
});

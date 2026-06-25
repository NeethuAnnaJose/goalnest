import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

final loansProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getLoans();
});

final upcomingEmisProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getUpcomingEmis();
});

final emiSummaryProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final fy = ref.watch(selectedFyProvider);
  return ref.read(apiServiceProvider).getEmiSummary(fy: fy);
});

final emiTrackerProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, loanId) async {
  return ref.read(apiServiceProvider).getEmiTracker(loanId);
});

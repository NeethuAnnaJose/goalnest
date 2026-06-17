import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

final loansProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getLoans();
});

final upcomingEmisProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getUpcomingEmis();
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

final goalsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getGoals();
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

final reportsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getReports();
});

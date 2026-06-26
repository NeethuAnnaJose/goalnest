import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core_providers.dart';

final profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getProfile();
});

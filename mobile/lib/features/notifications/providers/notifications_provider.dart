import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

final notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiServiceProvider).getNotifications();
});

final unreadCountProvider = FutureProvider<int>((ref) async {
  return ref.read(apiServiceProvider).getUnreadCount();
});

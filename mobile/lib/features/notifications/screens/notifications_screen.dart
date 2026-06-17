import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(apiServiceProvider).markAllNotificationsRead();
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadCountProvider);
            },
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(notificationsProvider)),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const EmptyView(message: 'No notifications yet', icon: Icons.notifications_none);
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadCountProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              itemBuilder: (_, i) {
                final n = notifications[i] as Map<String, dynamic>;
                final isRead = n['isRead'] == true;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: isRead ? null : AppTheme.primary.withValues(alpha: 0.05),
                  child: ListTile(
                    leading: Icon(
                      _iconForType(n['type']?.toString() ?? ''),
                      color: isRead ? Colors.grey : AppTheme.primary,
                    ),
                    title: Text(n['title']?.toString() ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(n['body']?.toString() ?? ''),
                        const SizedBox(height: 4),
                        Text(MoneyFormatter.formatDate(n['createdAt']?.toString() ?? ''), style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                      ],
                    ),
                    onTap: () async {
                      if (!isRead) {
                        await ref.read(apiServiceProvider).markNotificationRead(n['id'].toString());
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(unreadCountProvider);
                      }
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'EMI_REMINDER': return Icons.payments;
      case 'GOAL_PROGRESS': return Icons.flag;
      case 'OVERSPENDING': return Icons.warning_amber;
      case 'SAVINGS_MILESTONE': return Icons.savings;
      case 'REPORT': return Icons.description;
      default: return Icons.notifications;
    }
  }
}

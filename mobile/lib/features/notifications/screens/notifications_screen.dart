import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    final list = notificationsAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(notificationsProvider)),
      data: (notifications) {
        if (notifications.isEmpty) {
          return const EmptyView(message: 'No notifications yet', icon: Icons.notifications_none_rounded);
        }
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(notificationsProvider);
            ref.invalidate(unreadCountProvider);
          },
          color: AppTheme.primary,
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(20, 12, 20, embedded ? 24 : 24),
            itemCount: notifications.length,
            itemBuilder: (_, i) {
              final n = notifications[i] as Map<String, dynamic>;
              final isRead = n['isRead'] == true;
              final type = n['type']?.toString() ?? '';
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: AppDecorations.card(
                  color: isRead ? AppTheme.cardBg : AppTheme.primaryMuted.withValues(alpha: 0.35),
                  elevated: !isRead,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    onTap: () async {
                      if (!isRead) {
                        await ref.read(apiServiceProvider).markNotificationRead(n['id'].toString());
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(unreadCountProvider);
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: AppDecorations.iconBadge(isRead ? AppTheme.textMuted : AppTheme.primary),
                            child: Icon(_iconForType(type), color: isRead ? AppTheme.textMuted : AppTheme.primary, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(n['title']?.toString() ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.w500 : FontWeight.w700, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text(n['body']?.toString() ?? '', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4)),
                                const SizedBox(height: 6),
                                Text(MoneyFormatter.formatDate(n['createdAt']?.toString() ?? ''), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20, color: AppTheme.danger),
                            onPressed: () async {
                              await ref.read(apiServiceProvider).deleteNotification(n['id'].toString());
                              ref.invalidate(notificationsProvider);
                              ref.invalidate(unreadCountProvider);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );

    if (embedded) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () async {
                    await ref.read(apiServiceProvider).markAllNotificationsRead();
                    ref.invalidate(notificationsProvider);
                    ref.invalidate(unreadCountProvider);
                  },
                  child: const Text('Mark all read'),
                ),
              ),
            ),
            Expanded(child: list),
          ],
        ),
      );
    }

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
      body: list,
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'EMI_REMINDER': return Icons.payments_rounded;
      case 'GOAL_PROGRESS': return Icons.flag_rounded;
      case 'OVERSPENDING': return Icons.warning_amber_rounded;
      case 'SAVINGS_MILESTONE': return Icons.savings_rounded;
      case 'REPORT': return Icons.description_rounded;
      default: return Icons.notifications_rounded;
    }
  }
}

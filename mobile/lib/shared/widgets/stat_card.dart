import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.subtitle,
    this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final String? subtitle;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppTheme.primary;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  )),
                  const SizedBox(height: 4),
                  Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  )),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade500,
                    )),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: accent, size: 22),
            ),
          ],
        ),
      ),
    );
  }
}

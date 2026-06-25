import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/billing_config.dart';
import '../../core/theme/app_colors.dart';

class TrialBanner extends ConsumerWidget {
  const TrialBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (BillingConfig.enabled) return const SizedBox.shrink();
    final colors = context.appColors;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colors.heroTint, colors.launchCardEnd.withValues(alpha: 0.5)],
        ),
        border: Border(bottom: BorderSide(color: colors.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.card_giftcard_rounded, size: 16, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              BillingConfig.trialMessage,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
            ),
          ),
        ],
      ),
    );
  }
}

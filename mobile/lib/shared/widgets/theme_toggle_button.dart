import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/theme/app_colors.dart';

class ThemeToggleButton extends ConsumerWidget {
  const ThemeToggleButton({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == AppThemeMode.dark;
    final colors = context.appColors;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => ref.read(themeModeProvider.notifier).toggle(),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: EdgeInsets.all(compact ? 8 : 10),
          decoration: BoxDecoration(
            color: colors.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: colors.border),
          ),
          child: Icon(
            isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            size: compact ? 18 : 20,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/financial_year_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/financial_year.dart';
import '../../features/dashboard/providers/dashboard_provider.dart';

class FinancialYearSelector extends ConsumerWidget {
  const FinancialYearSelector({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fyState = ref.watch(financialYearProvider);
    final years = FinancialYear.listYears(includeLabel: fyState.effectiveYear);
    final fy = FinancialYear.resolveDropdownValue(fyState.effectiveYear, years);
    final colors = context.appColors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!compact)
          Text(
            'Financial year',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: colors.mutedForeground),
          ),
        if (!compact) const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: fy,
          isExpanded: true,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            filled: true,
            fillColor: colors.muted.withValues(alpha: 0.5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
          items: years
              .map((y) => DropdownMenuItem(
                    value: y.label,
                    child: Text(FinancialYear.formatRange(y.label), style: const TextStyle(fontSize: 13)),
                  ))
              .toList(),
          onChanged: (v) async {
            if (v != null) {
              await ref.read(financialYearProvider.notifier).setFinancialYear(v);
              ref.invalidate(dashboardProvider);
            }
          },
        ),
      ],
    );
  }
}

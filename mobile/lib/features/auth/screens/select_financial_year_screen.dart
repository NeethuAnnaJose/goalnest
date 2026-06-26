import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../shared/widgets/auth_layout.dart';
import '../providers/auth_provider.dart';

class SelectFinancialYearScreen extends ConsumerWidget {
  const SelectFinancialYearScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fyState = ref.watch(financialYearProvider);
    final years = FinancialYear.listYears(includeLabel: fyState.effectiveYear);
    final colors = context.appColors;

    return _SelectFinancialYearBody(
      years: years,
      initialYear: FinancialYear.resolveDropdownValue(fyState.effectiveYear, years),
      colors: colors,
      onContinue: (selected) async {
        await ref.read(financialYearProvider.notifier).setFinancialYear(selected);
        ref.read(authProvider.notifier).completeFySelection();
      },
    );
  }
}

class _SelectFinancialYearBody extends StatefulWidget {
  const _SelectFinancialYearBody({
    required this.years,
    required this.initialYear,
    required this.colors,
    required this.onContinue,
  });

  final List<FinancialYear> years;
  final String initialYear;
  final AppColors colors;
  final Future<void> Function(String selected) onContinue;

  @override
  State<_SelectFinancialYearBody> createState() => _SelectFinancialYearBodyState();
}

class _SelectFinancialYearBodyState extends State<_SelectFinancialYearBody> {
  late String _selected;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialYear;
  }

  @override
  void didUpdateWidget(covariant _SelectFinancialYearBody oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialYear != widget.initialYear) {
      _selected = FinancialYear.resolveDropdownValue(_selected, widget.years);
    }
  }

  Future<void> _continue() async {
    setState(() => _loading = true);
    try {
      await widget.onContinue(_selected);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Choose your financial year',
      subtitle: 'Income, expenses, and reports will use this period',
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.date_range_rounded, size: 36, color: Theme.of(context).colorScheme.primary),
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            value: FinancialYear.resolveDropdownValue(_selected, widget.years),
            decoration: const InputDecoration(labelText: 'Financial year'),
            items: widget.years
                .map((y) => DropdownMenuItem(value: y.label, child: Text(FinancialYear.formatRange(y.label))))
                .toList(),
            onChanged: (v) => setState(() => _selected = v ?? _selected),
          ),
          const SizedBox(height: 8),
          Text(
            'Viewing data from ${FinancialYear.formatRange(_selected)} (Indian FY: April to March)',
            style: TextStyle(fontSize: 13, color: widget.colors.mutedForeground, height: 1.4),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _continue,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                  )
                : const Text('Continue to dashboard'),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/financial_year_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/financial_year.dart';
import '../../../shared/widgets/auth_layout.dart';
import '../providers/auth_provider.dart';

class SelectFinancialYearScreen extends ConsumerStatefulWidget {
  const SelectFinancialYearScreen({super.key});

  @override
  ConsumerState<SelectFinancialYearScreen> createState() => _SelectFinancialYearScreenState();
}

class _SelectFinancialYearScreenState extends ConsumerState<SelectFinancialYearScreen> {
  late String _selected;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _selected = ref.read(financialYearProvider).effectiveYear;
  }

  Future<void> _continue() async {
    setState(() => _loading = true);
    try {
      await ref.read(financialYearProvider.notifier).setFinancialYear(_selected);
      ref.read(authProvider.notifier).completeFySelection();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final years = FinancialYear.listYears();
    final colors = context.appColors;

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
            value: _selected,
            decoration: const InputDecoration(labelText: 'Financial year'),
            items: years
                .map((y) => DropdownMenuItem(value: y.label, child: Text(FinancialYear.formatRange(y.label))))
                .toList(),
            onChanged: (v) => setState(() => _selected = v ?? _selected),
          ),
          const SizedBox(height: 8),
          Text(
            'Viewing data from ${FinancialYear.formatRange(_selected)} (Indian FY: April to March)',
            style: TextStyle(fontSize: 13, color: colors.mutedForeground, height: 1.4),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _continue,
            child: _loading
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Text('Continue to dashboard'),
          ),
        ],
      ),
    );
  }
}

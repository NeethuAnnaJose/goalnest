import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_decorations.dart';

class AffordabilityScreen extends ConsumerStatefulWidget {
  const AffordabilityScreen({super.key});

  @override
  ConsumerState<AffordabilityScreen> createState() => _AffordabilityScreenState();
}

class _AffordabilityScreenState extends ConsumerState<AffordabilityScreen> {
  final _nameController = TextEditingController();
  final _costController = TextEditingController();
  Map<String, dynamic>? _result;
  bool _loading = false;

  bool get _canSubmit =>
      _nameController.text.trim().isNotEmpty && _costController.text.trim().isNotEmpty;

  @override
  void dispose() {
    _nameController.dispose();
    _costController.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    if (!_canSubmit) return;
    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final result = await ref.read(apiServiceProvider).checkAffordability(
        productName: _nameController.text.trim(),
        productCost: _costController.text.trim(),
      );
      setState(() => _result = result);
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ref.read(apiClientProvider).getErrorMessage(e)),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final verdict = _result?['verdict']?.toString();
    final reasoning = (_result?['reasoning'] as List<dynamic>?) ?? [];
    final goalImpacts = (_result?['goalImpacts'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Text(
            'See if a purchase fits your budget right now',
            style: TextStyle(color: colors.mutedForeground),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: AppDecorations.card(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shopping_cart_outlined, size: 20),
                    SizedBox(width: 8),
                    Text('Product details', style: TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Product name',
                    hintText: 'Laptop, bike, furniture…',
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _costController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Product cost (₹)',
                    prefixText: '₹ ',
                    hintText: '150000',
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _loading || !_canSubmit ? null : _check,
                  child: _loading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text('Check'),
                ),
              ],
            ),
          ),
          if (_result != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: AppDecorations.card(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _VerdictBadge(verdict: verdict ?? ''),
                  const SizedBox(height: 12),
                  Text(
                    '${_result!['productName']}: ₹${_formatMajor(_result!['productCostMajor'] ?? _result!['productCost'])}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  if (_result!['monthsUntilRecommended'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Recommended after ${_result!['monthsUntilRecommended']} month(s) of saving.',
                    ),
                  ],
                  if (_result!['impactOnGoals'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _result!['impactOnGoals'].toString(),
                      style: TextStyle(color: colors.mutedForeground, height: 1.4),
                    ),
                  ],
                  if (_hasFinancialContext(_result!)) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (_result!['currentSavingsMajor'] != null)
                          _StatChip('Savings', _result!['currentSavingsMajor']),
                        if (_result!['monthlyIncomeMajor'] != null)
                          _StatChip('Avg income/mo', _result!['monthlyIncomeMajor']),
                        if (_result!['monthlyExpensesMajor'] != null)
                          _StatChip('Avg expenses/mo', _result!['monthlyExpensesMajor']),
                        if (_result!['safeToSpendMajor'] != null)
                          _StatChip('Left after bills', _result!['safeToSpendMajor']),
                      ],
                    ),
                  ],
                  if (reasoning.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    ...reasoning.map(
                      (r) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• $r', style: const TextStyle(fontSize: 14, height: 1.4)),
                      ),
                    ),
                  ],
                  if (goalImpacts.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: colors.muted.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Impact on goals', style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          ...goalImpacts.map((g) {
                            final goal = g as Map<String, dynamic>;
                            final delay = goal['estimatedDelayMonths'];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '${goal['goalName']}: ${goal['currentProgress']}% complete'
                                '${delay != null && (delay as num) > 0 ? ' · +${delay}mo delay' : ''}',
                                style: TextStyle(color: colors.mutedForeground, fontSize: 13),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  bool _hasFinancialContext(Map<String, dynamic> result) {
    return result['currentSavingsMajor'] != null ||
        result['safeToSpendMajor'] != null ||
        result['monthlyIncomeMajor'] != null;
  }

  String _formatMajor(dynamic value) {
    final n = double.tryParse(value.toString()) ?? 0;
    return n.toStringAsFixed(n.truncateToDouble() == n ? 0 : 2);
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip(this.label, this.value);
  final String label;
  final dynamic value;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final n = double.tryParse(value.toString()) ?? 0;
    return Container(
      width: 140,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.muted.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: colors.mutedForeground)),
          Text(
            '₹${n.toStringAsFixed(0)}',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _VerdictBadge extends StatelessWidget {
  const _VerdictBadge({required this.verdict});
  final String verdict;

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = switch (verdict) {
      'AFFORDABLE' => ('Affordable', AppTheme.success, Icons.check_circle_rounded),
      'NOT_RECOMMENDED' => ('Not recommended', AppTheme.danger, Icons.cancel_rounded),
      'RECOMMENDED_AFTER' => ('Save first', AppTheme.warning, Icons.schedule_rounded),
      _ => ('Result', AppTheme.primary, Icons.info_outline),
    };
    return Row(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      ],
    );
  }
}

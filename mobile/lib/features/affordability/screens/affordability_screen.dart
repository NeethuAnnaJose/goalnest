import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_decorations.dart';
import '../../../shared/widgets/loading_view.dart';

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

  @override
  void dispose() {
    _nameController.dispose();
    _costController.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    setState(() { _loading = true; _result = null; });
    try {
      final result = await ref.read(apiServiceProvider).checkAffordability(
        productName: _nameController.text.trim(),
        productCost: _costController.text.trim(),
      );
      setState(() => _result = result);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final verdict = _result?['verdict']?.toString();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Text('See if a purchase fits your budget right now', style: TextStyle(color: colors.mutedForeground)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: AppDecorations.card(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Row(children: [Icon(Icons.shopping_cart_outlined, size: 20), SizedBox(width: 8), Text('Product details', style: TextStyle(fontWeight: FontWeight.w700))]),
                const SizedBox(height: 16),
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Product name', hintText: 'Laptop, bike, furniture…')),
                const SizedBox(height: 12),
                TextField(controller: _costController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Product cost (₹)', prefixText: '₹ ')),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _loading || _nameController.text.isEmpty ? null : _check,
                  child: _loading ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white)) : const Text('Check'),
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
                    '${_result!['productName']}: ₹${_result!['productCostMajor'] ?? _result!['productCost']}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  if (_result!['monthsUntilRecommended'] != null) ...[
                    const SizedBox(height: 8),
                    Text('Recommended after ${_result!['monthsUntilRecommended']} month(s) of saving.'),
                  ],
                  if (_result!['impactOnGoals'] != null) ...[
                    const SizedBox(height: 8),
                    Text(_result!['impactOnGoals'].toString(), style: TextStyle(color: colors.mutedForeground, height: 1.4)),
                  ],
                ],
              ),
            ),
          ],
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
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
          child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class MfaScreen extends ConsumerStatefulWidget {
  const MfaScreen({super.key});

  @override
  ConsumerState<MfaScreen> createState() => _MfaScreenState();
}

class _MfaScreenState extends ConsumerState<MfaScreen> {
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final success = await ref.read(authProvider.notifier).verifyMfa(_codeController.text);
    if (!mounted) return;
    if (success) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid MFA code'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Two-Factor Auth')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.shield_outlined, size: 64, color: AppTheme.primary),
            const SizedBox(height: 16),
            const Text('Enter the 6-digit code from your authenticator app'),
            const SizedBox(height: 24),
            TextField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
              decoration: const InputDecoration(counterText: ''),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: auth.isLoading ? null : _verify,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                child: auth.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Verify'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

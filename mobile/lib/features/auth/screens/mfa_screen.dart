import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_layout.dart';
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
      // Navigation handled by ref.listen when auth state updates
    } else {
      // Error shown via ref.listen
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final colors = context.appColors;

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.error != null && next.error != prev?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppTheme.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
        ref.read(authProvider.notifier).clearError();
      }
      if (next.isAuthenticated && prev?.isAuthenticated != true) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    });

    return AuthLayout(
      title: 'Two-factor authentication',
      subtitle: 'Enter the 6-digit code from your authenticator app',
      onLogoTap: () {
        if (Navigator.canPop(context)) Navigator.pop(context);
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              counterText: '',
              hintText: '• • • • • •',
              hintStyle: TextStyle(color: colors.mutedForeground, letterSpacing: 8),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: auth.isSubmitting ? null : _verify,
            child: auth.isSubmitting
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                  )
                : const Text('Verify'),
          ),
        ],
      ),
    );
  }
}

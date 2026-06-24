import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/providers/theme_provider.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/landing/screens/landing_screen.dart';
import 'shared/screens/home_shell.dart';
import 'shared/widgets/loading_view.dart';

class GoalNestApp extends ConsumerWidget {
  const GoalNestApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'GoalNest',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode == AppThemeMode.dark ? ThemeMode.dark : ThemeMode.light,
      home: auth.isLoading
          ? const Scaffold(body: LoadingView(message: 'Loading...'))
          : auth.isAuthenticated
              ? const HomeShell()
              : const LandingScreen(),
    );
  }
}

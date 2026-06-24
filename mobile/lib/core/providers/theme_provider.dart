import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeKey = 'goalnest-theme';

enum AppThemeMode { light, dark }

class ThemeNotifier extends StateNotifier<AppThemeMode> {
  ThemeNotifier() : super(AppThemeMode.light) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_themeKey);
    if (stored == 'dark') {
      state = AppThemeMode.dark;
    } else if (stored == 'light') {
      state = AppThemeMode.light;
    } else {
      final platformBrightness = WidgetsBinding.instance.platformDispatcher.platformBrightness;
      state = platformBrightness == Brightness.dark ? AppThemeMode.dark : AppThemeMode.light;
    }
  }

  Future<void> toggle() async {
    state = state == AppThemeMode.light ? AppThemeMode.dark : AppThemeMode.light;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, state == AppThemeMode.dark ? 'dark' : 'light');
  }

  Future<void> setMode(AppThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode == AppThemeMode.dark ? 'dark' : 'light');
  }
}

final themeModeProvider = StateNotifierProvider<ThemeNotifier, AppThemeMode>((ref) => ThemeNotifier());

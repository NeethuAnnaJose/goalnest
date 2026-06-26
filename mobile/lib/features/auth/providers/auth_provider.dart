import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/financial_year_provider.dart';

class AuthState {
  const AuthState({
    this.isAuthenticated = false,
    this.isInitializing = true,
    this.isSubmitting = false,
    this.pendingFySelection = false,
    this.user,
    this.mfaTempToken,
    this.error,
  });

  final bool isAuthenticated;
  final bool isInitializing;
  final bool isSubmitting;
  /// After login/register — show FY picker like web `/select-financial-year`.
  final bool pendingFySelection;
  final Map<String, dynamic>? user;
  final String? mfaTempToken;
  final String? error;

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isInitializing,
    bool? isSubmitting,
    bool? pendingFySelection,
    Map<String, dynamic>? user,
    String? mfaTempToken,
    String? error,
    bool clearMfa = false,
    bool clearError = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isInitializing: isInitializing ?? this.isInitializing,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      pendingFySelection: pendingFySelection ?? this.pendingFySelection,
      user: user ?? this.user,
      mfaTempToken: clearMfa ? null : (mfaTempToken ?? this.mfaTempToken),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState()) {
    _checkAuth();
  }

  final Ref _ref;

  Future<void> _checkAuth() async {
    final client = _ref.read(apiClientProvider);
    final hasToken = await client.hasToken();
    if (hasToken) {
      try {
        final profile = await _ref.read(apiServiceProvider).getProfile();
        await _ref.read(financialYearProvider.notifier).loadFromProfile();
        state = AuthState(isAuthenticated: true, isInitializing: false, user: profile);
        return;
      } catch (_) {
        await client.clearTokens();
      }
    }
    state = const AuthState(isInitializing: false);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.login(email, password);

      if (result['mfaRequired'] == true) {
        state = AuthState(
          isInitializing: false,
          isSubmitting: false,
          mfaTempToken: result['tempToken'] as String?,
        );
        return false;
      }

      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      await _ref.read(financialYearProvider.notifier).loadFromProfile();
      state = AuthState(
        isAuthenticated: true,
        isInitializing: false,
        pendingFySelection: true,
        user: profile,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: _ref.read(apiClientProvider).getErrorMessage(e),
      );
      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyMfa(String code) async {
    final tempToken = state.mfaTempToken;
    if (tempToken == null) return false;
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.verifyMfa(code, tempToken);
      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      await _ref.read(financialYearProvider.notifier).loadFromProfile();
      state = AuthState(
        isAuthenticated: true,
        isInitializing: false,
        pendingFySelection: true,
        user: profile,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: _ref.read(apiClientProvider).getErrorMessage(e),
      );
      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.register(email: email, password: password, name: name);
      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      await _ref.read(financialYearProvider.notifier).loadFromProfile();
      state = AuthState(
        isAuthenticated: true,
        isInitializing: false,
        pendingFySelection: true,
        user: profile,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: _ref.read(apiClientProvider).getErrorMessage(e),
      );
      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _ref.read(apiServiceProvider).logout();
    state = const AuthState(isInitializing: false);
  }

  void completeFySelection() {
    state = state.copyWith(pendingFySelection: false);
  }

  Future<void> refreshProfile() async {
    final profile = await _ref.read(apiServiceProvider).getProfile();
    state = state.copyWith(user: profile);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

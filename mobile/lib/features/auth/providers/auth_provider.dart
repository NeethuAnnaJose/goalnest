import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';

class AuthState {
  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = true,
    this.user,
    this.mfaTempToken,
    this.error,
  });

  final bool isAuthenticated;
  final bool isLoading;
  final Map<String, dynamic>? user;
  final String? mfaTempToken;
  final String? error;

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Map<String, dynamic>? user,
    String? mfaTempToken,
    String? error,
    bool clearMfa = false,
    bool clearError = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
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
        state = AuthState(isAuthenticated: true, isLoading: false, user: profile);
        return;
      } catch (_) {
        await client.clearTokens();
      }
    }
    state = const AuthState(isLoading: false);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.login(email, password);

      if (result['mfaRequired'] == true) {
        state = AuthState(
          isLoading: false,
          mfaTempToken: result['tempToken'] as String?,
        );
        return false; // needs MFA
      }

      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      state = AuthState(isAuthenticated: true, isLoading: false, user: profile);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _ref.read(apiClientProvider).getErrorMessage(e));
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyMfa(String code) async {
    final tempToken = state.mfaTempToken;
    if (tempToken == null) return false;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.verifyMfa(code, tempToken);
      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      state = AuthState(isAuthenticated: true, isLoading: false, user: profile);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _ref.read(apiClientProvider).getErrorMessage(e));
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final api = _ref.read(apiServiceProvider);
      final client = _ref.read(apiClientProvider);
      final result = await api.register(email: email, password: password, name: name);
      await client.saveTokens(
        result['accessToken'] as String,
        result['refreshToken'] as String,
      );
      final profile = await api.getProfile();
      state = AuthState(isAuthenticated: true, isLoading: false, user: profile);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _ref.read(apiClientProvider).getErrorMessage(e));
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _ref.read(apiClientProvider).clearTokens();
    state = const AuthState(isLoading: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

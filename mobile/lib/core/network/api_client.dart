import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: ApiConstants.accessTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final opts = error.requestOptions;
            final token = await _storage.read(key: ApiConstants.accessTokenKey);
            opts.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          }
        }
        handler.next(error);
      },
    ));
  }

  final FlutterSecureStorage _storage;
  late final Dio _dio;

  Dio get dio => _dio;

  Future<bool> _refreshToken() async {
    final refresh = await _storage.read(key: ApiConstants.refreshTokenKey);
    if (refresh == null) return false;
    try {
      final response = await Dio().post(
        '${ApiConstants.baseUrl}/auth/refresh',
        data: {'refreshToken': refresh},
      );
      await _storage.write(
        key: ApiConstants.accessTokenKey,
        value: response.data['accessToken'] as String,
      );
      await _storage.write(
        key: ApiConstants.refreshTokenKey,
        value: response.data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await clearTokens();
      return false;
    }
  }

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: ApiConstants.accessTokenKey, value: access);
    await _storage.write(key: ApiConstants.refreshTokenKey, value: refresh);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: ApiConstants.accessTokenKey);
    await _storage.delete(key: ApiConstants.refreshTokenKey);
  }

  Future<bool> hasToken() async {
    final token = await _storage.read(key: ApiConstants.accessTokenKey);
    return token != null && token.isNotEmpty;
  }

  String getErrorMessage(DioException e) {
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Cannot reach the server (${ApiConstants.baseUrl}). Check your connection.';
    }
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      final msg = data['message'];
      if (msg is List) return msg.join(', ');
      return msg.toString();
    }
    return e.message ?? 'Something went wrong';
  }
}

import 'package:flutter/foundation.dart';

class ApiConstants {
  /// Override at build/run time:
  /// `flutter run --dart-define=API_BASE_URL=https://your-api/api/v1`
  static const String _envUrl = String.fromEnvironment('API_BASE_URL');

  /// Production Railway backend (used for local web dev when no proxy).
  static const String productionUrl =
      'https://backend-production-c2da.up.railway.app/api/v1';

  static String get baseUrl {
    if (_envUrl.isNotEmpty) return _envUrl;

    if (kIsWeb) {
      // Production Docker build should pass API_BASE_URL=/api/v1 (nginx proxies /api).
      // Local `flutter run -d chrome` has no proxy — call the hosted API directly.
      return productionUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3001/api/v1';
      case TargetPlatform.iOS:
        return 'http://127.0.0.1:3001/api/v1';
      default:
        return 'http://localhost:3001/api/v1';
    }
  }

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
}

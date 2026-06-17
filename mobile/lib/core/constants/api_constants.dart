class ApiConstants {
  /// Android emulator: use 10.0.2.2 to reach host machine localhost.
  /// iOS simulator: use localhost or 127.0.0.1
  /// Physical device: use your machine's LAN IP (e.g. 192.168.1.x)
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001/api/v1',
  );

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
}

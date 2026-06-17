import 'package:dio/dio.dart';
import 'api_client.dart';

class ApiService {
  ApiService(this._client);
  final ApiClient _client;
  Dio get _dio => _client.dio;

  // ── Auth ──────────────────────────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
      'deviceName': 'GoalNest Mobile',
      'deviceType': 'mobile',
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final res = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      if (name != null) 'name': name,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyMfa(String code, String tempToken) async {
    final res = await _dio.post('/auth/mfa/verify', data: {
      'code': code,
      'tempToken': tempToken,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<void> logout() async {
    await _client.clearTokens();
  }

  // ── Users ─────────────────────────────────────────
  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get('/users/me');
    return res.data as Map<String, dynamic>;
  }

  // ── Dashboard ─────────────────────────────────────
  Future<Map<String, dynamic>> getDashboard() async {
    final res = await _dio.get('/dashboard');
    return res.data as Map<String, dynamic>;
  }

  // ── Expenses ──────────────────────────────────────
  Future<List<dynamic>> getExpenses({String? month}) async {
    final res = await _dio.get('/expenses', queryParameters: {
      if (month != null) 'month': month,
    });
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    final res = await _dio.post('/expenses', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> deleteExpense(String id) async {
    await _dio.delete('/expenses/$id');
  }

  Future<List<dynamic>> getExpenseBreakdown(String month) async {
    final res = await _dio.get('/expenses/breakdown', queryParameters: {'month': month});
    return res.data as List<dynamic>;
  }

  // ── Savings ───────────────────────────────────────
  Future<List<dynamic>> getSavings() async {
    final res = await _dio.get('/savings');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getSavingsGrowth() async {
    final res = await _dio.get('/savings/growth');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createSavings(Map<String, dynamic> data) async {
    final res = await _dio.post('/savings', data: data);
    return res.data as Map<String, dynamic>;
  }

  // ── Goals ─────────────────────────────────────────
  Future<List<dynamic>> getGoals() async {
    final res = await _dio.get('/goals');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createGoal(Map<String, dynamic> data) async {
    final res = await _dio.post('/goals', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> addGoalProgress(String id, String amount) async {
    await _dio.put('/goals/$id/progress', data: {'amount': amount});
  }

  Future<void> deleteGoal(String id) async {
    await _dio.delete('/goals/$id');
  }

  // ── Loans ─────────────────────────────────────────
  Future<List<dynamic>> getLoans() async {
    final res = await _dio.get('/loans');
    return res.data as List<dynamic>;
  }

  Future<List<dynamic>> getUpcomingEmis() async {
    final res = await _dio.get('/loans/upcoming-emis');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createLoan(Map<String, dynamic> data) async {
    final res = await _dio.post('/loans', data: data);
    return res.data as Map<String, dynamic>;
  }

  // ── Notifications ─────────────────────────────────
  Future<List<dynamic>> getNotifications() async {
    final res = await _dio.get('/notifications');
    return res.data as List<dynamic>;
  }

  Future<int> getUnreadCount() async {
    final res = await _dio.get('/notifications/unread-count');
    return (res.data as Map<String, dynamic>)['count'] as int? ?? 0;
  }

  Future<void> markNotificationRead(String id) async {
    await _dio.put('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.put('/notifications/read-all');
  }

  // ── Reports ───────────────────────────────────────
  Future<List<dynamic>> getReports() async {
    final res = await _dio.get('/reports');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> generateReport({
    required String period,
    required String format,
  }) async {
    final res = await _dio.post('/reports/generate', data: {
      'period': period,
      'format': format,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<String> exportReportCsv(String id) async {
    final res = await _dio.get<String>('/reports/$id/export/csv');
    return res.data ?? '';
  }

  // ── Health Score ──────────────────────────────────
  Future<Map<String, dynamic>> getHealthScore() async {
    final res = await _dio.get('/health-score');
    return res.data as Map<String, dynamic>;
  }

  // ── Insights ───────────────────────────────────
  Future<List<dynamic>> getAiInsights({String? period, String? category}) async {
    final res = await _dio.get('/ai-insights', queryParameters: {
      if (period != null) 'period': period,
      if (category != null) 'category': category,
    });
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> generateDailyInsights() async {
    final res = await _dio.post('/ai-insights/daily');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> generateWeeklyReport() async {
    final res = await _dio.post('/ai-insights/weekly');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> generateMonthlyReport() async {
    final res = await _dio.post('/ai-insights/monthly');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> detectOverspending() async {
    final res = await _dio.post('/ai-insights/overspending');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getGoalRecommendations() async {
    final res = await _dio.post('/ai-insights/goal-recommendations');
    return res.data as Map<String, dynamic>;
  }
}

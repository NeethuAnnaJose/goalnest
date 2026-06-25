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
    final res = await _dio.post('/auth/mfa/verify', data: {'code': code, 'tempToken': tempToken});
    return res.data as Map<String, dynamic>;
  }

  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({required String token, required String newPassword}) async {
    await _dio.post('/auth/reset-password', data: {'token': token, 'newPassword': newPassword});
  }

  Future<void> logout() async {
    final refresh = await _client.readRefreshToken();
    if (refresh != null) {
      try {
        await _dio.post('/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {}
    }
    await _client.clearTokens();
  }

  // ── Users ─────────────────────────────────────────
  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get('/users/me');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await _dio.put('/users/me', data: data);
    return res.data as Map<String, dynamic>;
  }

  // ── Dashboard ─────────────────────────────────────
  Future<Map<String, dynamic>> getDashboard({String? fy}) async {
    final res = await _dio.get('/dashboard', queryParameters: {if (fy != null) 'fy': fy});
    return res.data as Map<String, dynamic>;
  }

  // ── Income ────────────────────────────────────────
  Future<List<dynamic>> getIncome({String? month, String? fy}) async {
    final res = await _dio.get('/income', queryParameters: {
      if (month != null) 'month': month,
      if (fy != null) 'fy': fy,
    });
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createIncome(Map<String, dynamic> data) async {
    final res = await _dio.post('/income', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateIncome(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/income/$id', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> deleteIncome(String id) async {
    await _dio.delete('/income/$id');
  }

  // ── Expenses ──────────────────────────────────────
  Future<List<dynamic>> getExpenses({String? month, String? fy, String? category, String? search}) async {
    final res = await _dio.get('/expenses', queryParameters: {
      if (month != null) 'month': month,
      if (fy != null) 'fy': fy,
      if (category != null) 'category': category,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    final res = await _dio.post('/expenses', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateExpense(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/expenses/$id', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> deleteExpense(String id) async {
    await _dio.delete('/expenses/$id');
  }

  Future<List<dynamic>> getExpenseBreakdown({String? month, String? fy}) async {
    final res = await _dio.get('/expenses/breakdown', queryParameters: {
      if (month != null) 'month': month,
      if (fy != null) 'fy': fy,
    });
    return res.data as List<dynamic>;
  }

  // ── Savings ───────────────────────────────────────
  Future<List<dynamic>> getSavings() async {
    final res = await _dio.get('/savings');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getSavingsGrowth({String? fy}) async {
    final res = await _dio.get('/savings/growth', queryParameters: {if (fy != null) 'fy': fy});
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getSavingsContributions({String? fy, String? accountId}) async {
    final res = await _dio.get('/savings/contributions', queryParameters: {
      if (fy != null) 'fy': fy,
      if (accountId != null) 'accountId': accountId,
    });
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createSavings(Map<String, dynamic> data) async {
    final res = await _dio.post('/savings', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateSavings(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/savings/$id', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> depositSavings(String id, String amount) async {
    await _dio.post('/savings/$id/deposit', data: {'amount': amount});
  }

  Future<void> recordSavingsContribution(String id, String month, {String? amount}) async {
    await _dio.post('/savings/$id/contributions', data: {
      'month': month,
      if (amount != null) 'amount': amount,
    });
  }

  Future<void> removeSavingsContribution(String id, String month) async {
    await _dio.delete('/savings/$id/contributions/$month');
  }

  Future<void> deleteSavings(String id) async {
    await _dio.delete('/savings/$id');
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

  Future<Map<String, dynamic>> updateGoal(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/goals/$id', data: data);
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

  Future<Map<String, dynamic>> getLoan(String id) async {
    final res = await _dio.get('/loans/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getUpcomingEmis() async {
    final res = await _dio.get('/loans/upcoming-emis');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createLoan(Map<String, dynamic> data) async {
    final res = await _dio.post('/loans', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateLoan(String id, Map<String, dynamic> data) async {
    final res = await _dio.put('/loans/$id', data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<void> deleteLoan(String id) async {
    await _dio.delete('/loans/$id');
  }

  // ── EMIs ──────────────────────────────────────────
  Future<Map<String, dynamic>> getEmiTracker(String loanId) async {
    final res = await _dio.get('/emis/tracker/$loanId');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getEmiSummary({String? fy}) async {
    final res = await _dio.get('/emis/summary', queryParameters: {if (fy != null) 'fy': fy});
    return res.data as Map<String, dynamic>;
  }

  Future<void> payEmi(String id, String paidDate, {String? notes}) async {
    await _dio.post('/emis/$id/pay', data: {'paidDate': paidDate, if (notes != null) 'notes': notes});
  }

  Future<void> unpayEmi(String id) async {
    await _dio.post('/emis/$id/unpay');
  }

  Future<void> markEmiMissed(String id) async {
    await _dio.post('/emis/$id/missed');
  }

  // ── Affordability & planners ──────────────────────
  Future<Map<String, dynamic>> checkAffordability({required String productName, required String productCost}) async {
    final res = await _dio.post('/affordability', data: {'productName': productName, 'productCost': productCost});
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> housePlanner({
    required String propertyPrice,
    required String downPaymentPercent,
    required String interestRate,
    required String monthlyPayment,
  }) async {
    final res = await _dio.post('/house-planner', data: {
      'propertyPrice': propertyPrice,
      'downPaymentPercent': downPaymentPercent,
      'interestRate': interestRate,
      'monthlyPayment': monthlyPayment,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> loanOffers({
    required String loanType,
    required String loanAmount,
    required String currentInterestRate,
    required String monthlyPayment,
  }) async {
    final res = await _dio.post('/house-planner/loan-offers', data: {
      'loanType': loanType,
      'loanAmount': loanAmount,
      'currentInterestRate': currentInterestRate,
      'monthlyPayment': monthlyPayment,
    });
    return res.data as Map<String, dynamic>;
  }

  // ── Notifications ─────────────────────────────────
  Future<List<dynamic>> getNotifications({bool? unreadOnly}) async {
    final res = await _dio.get('/notifications', queryParameters: {if (unreadOnly == true) 'unreadOnly': true});
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

  Future<void> deleteNotification(String id) async {
    await _dio.delete('/notifications/$id');
  }

  // ── Reports ───────────────────────────────────────
  Future<List<dynamic>> getReports() async {
    final res = await _dio.get('/reports');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> generateReport({required String period, required String format}) async {
    final res = await _dio.post('/reports/generate', data: {'period': period, 'format': format});
    return res.data as Map<String, dynamic>;
  }

  Future<String> exportReportCsv(String id) async {
    final res = await _dio.get<String>('/reports/$id/export/csv');
    return res.data ?? '';
  }

  Future<List<int>> exportReportExcel(String id) async {
    final res = await _dio.get<List<int>>('/reports/$id/export/excel', options: Options(responseType: ResponseType.bytes));
    return res.data ?? [];
  }

  Future<void> deleteReport(String id) async {
    await _dio.delete('/reports/$id');
  }

  // ── Health & AI ───────────────────────────────────
  Future<Map<String, dynamic>> getHealthScore() async {
    final res = await _dio.get('/health-score');
    return res.data as Map<String, dynamic>;
  }

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

  Future<void> markAiInsightRead(String id) async {
    await _dio.put('/ai-insights/$id/read');
  }

  // ── Admin ─────────────────────────────────────────
  Future<Map<String, dynamic>> getAdminOverview() async {
    final res = await _dio.get('/admin/overview');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAdminUsers({String? search, String? role, int page = 1}) async {
    final res = await _dio.get('/admin/users', queryParameters: {
      if (search != null) 'search': search,
      if (role != null) 'role': role,
      'page': page,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<void> updateAdminUser(String id, Map<String, dynamic> data) async {
    await _dio.patch('/admin/users/$id', data: data);
  }

  Future<Map<String, dynamic>> getAdminTickets({String? status, int page = 1}) async {
    final res = await _dio.get('/admin/tickets', queryParameters: {
      if (status != null) 'status': status,
      'page': page,
    });
    return res.data as Map<String, dynamic>;
  }
}

import '../../../core/utils/money_formatter.dart';

/// Read dashboard amounts from `formatted` with fallback to raw minor-unit fields.
class DashboardMoney {
  static String amount(Map<String, dynamic> data, String formattedKey, String rawKey) {
    final formatted = data['formatted'] as Map<String, dynamic>? ?? {};
    final fromFormatted = formatted[formattedKey];
    if (fromFormatted != null) {
      return MoneyFormatter.format(fromFormatted);
    }
    return MoneyFormatter.format(data[rawKey] ?? 0);
  }
}

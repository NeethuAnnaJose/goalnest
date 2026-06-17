import 'package:intl/intl.dart';

class MoneyFormatter {
  static final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  /// Converts minor units (paise) to major and formats.
  static String format(dynamic value, {String currency = 'INR'}) {
    if (value == null) return '-';
    if (value is String && value.contains('.')) {
      final parsed = double.tryParse(value);
      if (parsed != null) return _inr.format(parsed);
    }
    final numVal = _toNum(value);
    final major = numVal >= 10000 && numVal == numVal.roundToDouble()
        ? numVal / 100
        : numVal;
    if (currency == 'INR') return _inr.format(major);
    return '$currency ${major.toStringAsFixed(2)}';
  }

  static double _toNum(dynamic value) {
    if (value is int) return value.toDouble();
    if (value is double) return value;
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  static String currentMonth() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}';
  }

  static String formatDate(String date) {
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(date));
    } catch (_) {
      return date;
    }
  }
}

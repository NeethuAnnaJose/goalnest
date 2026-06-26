/// Indian financial year utilities — mirrors web `financial-year.ts`.
class FinancialYear {
  FinancialYear({
    required this.label,
    required this.startYear,
    required this.endYear,
    required this.startDate,
    required this.endDate,
  });

  final String label;
  final int startYear;
  final int endYear;
  final DateTime startDate;
  final DateTime endDate;

  static const storageKey = 'selectedFinancialYear';

  static FinancialYear parse(String fy) {
    final match = RegExp(r'^(\d{4})-(\d{2})$').firstMatch(fy);
    if (match == null) throw FormatException('Invalid financial year: $fy');
    final startYear = int.parse(match.group(1)!);
    final endShort = int.parse(match.group(2)!);
    final endYear = (startYear ~/ 100) * 100 + endShort;
    if (endYear != startYear + 1) throw FormatException('Invalid financial year: $fy');
    return FinancialYear(
      label: fy,
      startYear: startYear,
      endYear: endYear,
      startDate: DateTime(startYear, 4, 1),
      endDate: DateTime(endYear, 3, 31, 23, 59, 59, 999),
    );
  }

  static FinancialYear current([DateTime? date]) {
    final d = date ?? DateTime.now();
    final startYear = d.month >= 4 ? d.year : d.year - 1;
    final endYear = startYear + 1;
    return parse('$startYear-${endYear.toString().substring(2)}');
  }

  static List<FinancialYear> listYears({int count = 6, DateTime? from, String? includeLabel}) {
    final fyCurrent = FinancialYear.current(from);
    final years = <FinancialYear>[fyCurrent];
    for (var i = 1; i < count; i++) {
      final prevStart = fyCurrent.startYear - i;
      final prevEnd = prevStart + 1;
      years.add(parse('$prevStart-${prevEnd.toString().substring(2)}'));
    }
    if (includeLabel != null && includeLabel.isNotEmpty) {
      try {
        final extra = parse(includeLabel);
        if (!years.any((y) => y.label == extra.label)) {
          years.add(extra);
          years.sort((a, b) => b.startYear.compareTo(a.startYear));
        }
      } catch (_) {}
    }
    return years;
  }

  /// Pick a value that exists in [options], or fall back to the first / current FY.
  static String resolveDropdownValue(String value, List<FinancialYear> options) {
    if (options.any((y) => y.label == value)) return value;
    return options.isNotEmpty ? options.first.label : current().label;
  }

  static List<String> monthsInYear(String fy) {
    final parsed = parse(fy);
    final months = <String>[];
    for (var m = 4; m <= 12; m++) {
      months.add('${parsed.startYear}-${m.toString().padLeft(2, '0')}');
    }
    for (var m = 1; m <= 3; m++) {
      months.add('${parsed.endYear}-${m.toString().padLeft(2, '0')}');
    }
    return months;
  }

  static bool isDateInYear(DateTime date, String fy) {
    final range = parse(fy);
    return !date.isBefore(range.startDate) && !date.isAfter(range.endDate);
  }

  static String effectiveMonth(String fy, [DateTime? date]) {
    final d = date ?? DateTime.now();
    if (isDateInYear(d, fy)) {
      return '${d.year}-${d.month.toString().padLeft(2, '0')}';
    }
    final months = monthsInYear(fy);
    return months.last;
  }

  static String formatLabel(String fy) {
    final p = parse(fy);
    return 'FY ${p.startYear}-${p.endYear.toString().substring(2)}';
  }

  static String formatRange(String fy) {
    final p = parse(fy);
    return 'Apr ${p.startYear} to Mar ${p.endYear}';
  }

  static String formatMonth(String month) {
    final parts = month.split('-');
    final year = int.parse(parts[0]);
    final m = int.parse(parts[1]);
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${names[m - 1]} $year';
  }

  /// Today if [monthKey] is the current month, otherwise the last day of that month.
  static String defaultDateForMonth(String monthKey, [DateTime? now]) {
    final d = now ?? DateTime.now();
    final parts = monthKey.split('-');
    final year = int.parse(parts[0]);
    final m = int.parse(parts[1]);
    if (d.year == year && d.month == m) {
      return '${year}-${m.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    }
    final lastDay = DateTime(year, m + 1, 0).day;
    return '${year}-${m.toString().padLeft(2, '0')}-${lastDay.toString().padLeft(2, '0')}';
  }
}

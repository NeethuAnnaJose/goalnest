import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/financial_year.dart';
import 'core_providers.dart';

class FinancialYearState {
  const FinancialYearState({this.financialYear, this.isReady = false});

  final String? financialYear;
  final bool isReady;

  String get effectiveYear => financialYear ?? FinancialYear.current().label;

  FinancialYearState copyWith({String? financialYear, bool? isReady}) {
    return FinancialYearState(
      financialYear: financialYear ?? this.financialYear,
      isReady: isReady ?? this.isReady,
    );
  }
}

class FinancialYearNotifier extends StateNotifier<FinancialYearState> {
  FinancialYearNotifier(this._ref) : super(const FinancialYearState()) {
    _init();
  }

  final Ref _ref;

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    var fy = prefs.getString(FinancialYear.storageKey);
    fy = _resolveFinancialYear(fy);
    await prefs.setString(FinancialYear.storageKey, fy);
    state = FinancialYearState(financialYear: fy, isReady: true);
  }

  /// If stored FY does not contain today, use current FY (same as web).
  String _resolveFinancialYear(String? fy) {
    if (fy != null && fy.isNotEmpty && FinancialYear.isDateInYear(DateTime.now(), fy)) {
      return fy;
    }
    return FinancialYear.current().label;
  }

  Future<void> loadFromProfile() async {
    try {
      final profile = await _ref.read(apiServiceProvider).getProfile();
      final prefs = profile['financialPreferences'] as Map<String, dynamic>?;
      final fromProfile = prefs?['selectedFinancialYear']?.toString();
      final local = await SharedPreferences.getInstance();
      final stored = local.getString(FinancialYear.storageKey);
      final resolved = _resolveFinancialYear(fromProfile ?? stored);
      await setFinancialYear(resolved, syncProfile: false);
    } catch (_) {}
  }

  Future<void> setFinancialYear(String fy, {bool syncProfile = true}) async {
    final resolved = _resolveFinancialYear(fy);
    FinancialYear.parse(resolved);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(FinancialYear.storageKey, resolved);
    state = FinancialYearState(financialYear: resolved, isReady: true);

    if (syncProfile) {
      try {
        final profile = await _ref.read(apiServiceProvider).getProfile();
        final existing = profile['financialPreferences'] as Map<String, dynamic>? ?? {};
        await _ref.read(apiServiceProvider).updateProfile({
          'financialPreferences': {...existing, 'selectedFinancialYear': resolved},
        });
      } catch (_) {}
    }
  }
}

final financialYearProvider = StateNotifierProvider<FinancialYearNotifier, FinancialYearState>((ref) {
  return FinancialYearNotifier(ref);
});

/// Convenience: current FY string for API calls.
final selectedFyProvider = Provider<String>((ref) {
  return ref.watch(financialYearProvider).effectiveYear;
});

final activeMonthProvider = Provider<String>((ref) {
  final fy = ref.watch(selectedFyProvider);
  return FinancialYear.effectiveMonth(fy);
});

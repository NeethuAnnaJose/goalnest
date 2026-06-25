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
    if (fy == null || !FinancialYear.isDateInYear(DateTime.now(), fy)) {
      fy = FinancialYear.current().label;
      await prefs.setString(FinancialYear.storageKey, fy);
    }
    state = FinancialYearState(financialYear: fy, isReady: true);
  }

  Future<void> loadFromProfile() async {
    try {
      final profile = await _ref.read(apiServiceProvider).getProfile();
      final prefs = profile['financialPreferences'] as Map<String, dynamic>?;
      final fromProfile = prefs?['selectedFinancialYear']?.toString();
      if (fromProfile != null && fromProfile.isNotEmpty) {
        await setFinancialYear(fromProfile, syncProfile: false);
      }
    } catch (_) {}
  }

  Future<void> setFinancialYear(String fy, {bool syncProfile = true}) async {
    FinancialYear.parse(fy);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(FinancialYear.storageKey, fy);
    state = FinancialYearState(financialYear: fy, isReady: true);

    if (syncProfile) {
      try {
        final profile = await _ref.read(apiServiceProvider).getProfile();
        final existing = profile['financialPreferences'] as Map<String, dynamic>? ?? {};
        await _ref.read(apiServiceProvider).updateProfile({
          'financialPreferences': {...existing, 'selectedFinancialYear': fy},
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

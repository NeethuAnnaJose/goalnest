/// Mirrors web billing-config — payments off until billing is integrated.
class BillingConfig {
  static const bool enabled = false;
  static const int freeTrialDays = 30;

  static String get trialMessage => enabled
      ? 'Simple plans when you are ready to upgrade'
      : 'Everything free for $freeTrialDays days — no payment needed';

  static String? get launchBadge => enabled ? null : 'Free during early access';
}

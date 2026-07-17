import 'package:equatable/equatable.dart';

/// The reset flow's three steps.
///
/// Named after web's `type StepId = 'email' | 'sent' | 'reset'` rather than the
/// card's prose ("Request, Sent, NewPassword") — same three steps, and web is
/// the tiebreaker on naming.
enum ForgotStep { email, sent, reset }

/// Failure codes for the reset flow. Web keeps a pre-localized string in
/// `errorMsg`; see [SignUpError] for why mobile carries a code instead.
enum ForgotError {
  /// Web: `t('pages.forgot.errorTokenMissing')`.
  tokenMissing,

  /// Web: `t('pages.forgot.errorPasswordMismatch')`.
  passwordMismatch,

  /// Web: `t('pages.forgot.errorGeneric')`.
  generic,
}

/// Mirrors the reactive state of `apps/web/app/pages/forgot.vue`.
class ForgotState extends Equatable {
  const ForgotState({
    this.step = ForgotStep.email,
    this.email = '',
    this.newPassword = '',
    this.confirmPassword = '',
    this.resetToken = '',
    this.errorMessage,
    this.isPending = false,
    this.done = false,
  });

  final ForgotStep step;

  /// Web: `enteredEmail`. Also interpolated into the `sent` step's subtitle.
  final String email;

  final String newPassword;
  final String confirmPassword;

  /// Web reads this from `?token=` in the URL. A phone has no query string —
  /// the token arrives via the emailed link as a deep-link route argument, so
  /// the screen passes it in and a non-empty value starts the flow on
  /// [ForgotStep.reset] (web: the `initialStep` computed).
  final String resetToken;

  /// Web keeps a single `errorMsg` across all three steps, not one per step.
  final ForgotError? errorMessage;

  final bool isPending;

  /// Reset succeeded; the screen should return the user to sign-in.
  final bool done;

  /// Web: `:disabled="!enteredEmail.includes('@')"`.
  bool get canSubmitEmail => email.contains('@');

  /// Web: `:disabled="!newPassword || !confirmPassword"`.
  bool get canSubmitReset =>
      newPassword.isNotEmpty && confirmPassword.isNotEmpty;

  ForgotState copyWith({
    ForgotStep? step,
    String? email,
    String? newPassword,
    String? confirmPassword,
    String? resetToken,
    ForgotError? errorMessage,
    bool clearError = false,
    bool? isPending,
    bool? done,
  }) {
    return ForgotState(
      step: step ?? this.step,
      email: email ?? this.email,
      newPassword: newPassword ?? this.newPassword,
      confirmPassword: confirmPassword ?? this.confirmPassword,
      resetToken: resetToken ?? this.resetToken,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isPending: isPending ?? this.isPending,
      done: done ?? this.done,
    );
  }

  @override
  List<Object?> get props => [
    step,
    email,
    newPassword,
    confirmPassword,
    resetToken,
    errorMessage,
    isPending,
    done,
  ];
}

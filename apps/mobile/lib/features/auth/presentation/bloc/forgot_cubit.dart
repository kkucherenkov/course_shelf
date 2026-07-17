import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/forgot_state.dart';

/// Three-step password reset — Email → Sent → Reset.
///
/// Mirrors `apps/web/app/pages/forgot.vue`. One behavioural difference, and it
/// is deliberate: **web's `forgotPassword`/`resetPassword` are stubs** that
/// `console.warn` and resolve `{ ok: true }` without calling Better Auth, so
/// web's UI always advances to "Sent". This cubit makes the real calls, as the
/// card requires ("calls Better Auth `forgotPassword` / `resetPassword`"), and
/// surfaces failures instead of claiming an email was sent that was not.
///
/// Against the current backend the request step therefore *fails*: Better Auth
/// throws `RESET_PASSWORD_DISABLED` unless `emailAndPassword.sendResetPassword`
/// is configured, and `auth.service.ts` does not configure it. Telling the user
/// "check your email" when no mail can be sent is the worse outcome, so the
/// error is shown. Enumeration safety is unaffected — Better Auth already
/// answers `{status: true}` for unknown addresses, so a success still reveals
/// nothing about whether the account exists.
class ForgotCubit extends Cubit<ForgotState> {
  /// [resetToken] arrives from the emailed deep link. Non-empty starts the flow
  /// on [ForgotStep.reset], mirroring web's `?token=` → `initialStep` computed.
  ForgotCubit({required AuthRepository authRepository, String resetToken = ''})
    : _authRepository = authRepository,
      super(
        ForgotState(
          step: resetToken.isEmpty ? ForgotStep.email : ForgotStep.reset,
          resetToken: resetToken,
        ),
      );

  final AuthRepository _authRepository;

  void setEmail(String value) => emit(state.copyWith(email: value));
  void setNewPassword(String value) => emit(state.copyWith(newPassword: value));
  void setConfirmPassword(String value) =>
      emit(state.copyWith(confirmPassword: value));

  /// Web: `onSendEmail`.
  Future<void> submitEmail() async {
    emit(state.copyWith(isPending: true, clearError: true));
    try {
      await _authRepository.requestPasswordReset(email: state.email);
      if (isClosed) return;
      emit(state.copyWith(step: ForgotStep.sent, isPending: false));
    } on Object {
      if (isClosed) return;
      emit(state.copyWith(isPending: false, errorMessage: ForgotError.generic));
    }
  }

  /// Web: `onResetPassword`. Both guards run before the network call and in
  /// web's order — missing token first, then mismatch.
  Future<void> submitReset() async {
    if (state.resetToken.isEmpty) {
      emit(state.copyWith(errorMessage: ForgotError.tokenMissing));
      return;
    }
    if (state.newPassword != state.confirmPassword) {
      emit(state.copyWith(errorMessage: ForgotError.passwordMismatch));
      return;
    }
    emit(state.copyWith(isPending: true, clearError: true));
    try {
      await _authRepository.resetPassword(
        token: state.resetToken,
        newPassword: state.newPassword,
      );
      if (isClosed) return;
      emit(state.copyWith(isPending: false, done: true));
    } on Object {
      if (isClosed) return;
      emit(state.copyWith(isPending: false, errorMessage: ForgotError.generic));
    }
  }
}

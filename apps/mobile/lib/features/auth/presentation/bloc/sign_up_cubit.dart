import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_exception.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_up_state.dart';

/// Three-step registration wizard — Account → (Verify) → Library.
///
/// Mirrors `apps/web/app/pages/sign-up.vue`; see [SignUpState] for the
/// field-by-field mapping.
///
/// **Why it calls [AuthRepository.signUp] directly instead of
/// [AuthCubit.signUp]:** the backend runs Better Auth with `autoSignIn: true`,
/// so registering returns a live session. Routing that through [AuthCubit]
/// would emit `authenticated` at the end of *step 1*, and `AuthGate` — which
/// watches exactly that — would swap the whole wizard out for `MainShell`
/// before the user ever saw steps 2 and 3. So the account call stays off the
/// session cubit, and the session is adopted only when the wizard finishes,
/// via [AuthCubit.checkSession] (the bearer token is already persisted by
/// `AuthApiImpl`, so the interim `POST /libraries` is authenticated).
class SignUpCubit extends Cubit<SignUpState> {
  SignUpCubit({
    required AuthCubit authCubit,
    required AuthRepository authRepository,
    required InstanceRepository instanceRepository,
    required LibraryRepository libraryRepository,
  }) : _authCubit = authCubit,
       _authRepository = authRepository,
       _instanceRepository = instanceRepository,
       _libraryRepository = libraryRepository,
       super(const SignUpState());

  final AuthCubit _authCubit;
  final AuthRepository _authRepository;
  final InstanceRepository _instanceRepository;
  final LibraryRepository _libraryRepository;

  Timer? _resendTimer;

  /// Web mirrors this with `useInstanceConfig()` + `useFirstRun()` firing on
  /// setup. Neither probe throws (both fall back), so this needs no try/catch.
  Future<void> start() async {
    final (config, hasUsers) = await (
      _instanceRepository.getInstanceConfig(),
      _instanceRepository.hasUsers(),
    ).wait;
    if (isClosed) return;
    emit(state.copyWith(config: config, isFirstAdmin: !hasUsers));
  }

  void setFullName(String value) => emit(state.copyWith(fullName: value));
  void setEmail(String value) => emit(state.copyWith(email: value));
  void setPassword(String value) => emit(state.copyWith(password: value));

  void setLibraryName(String value) => emit(state.copyWith(libraryName: value));
  void setLibraryPath(String value) => emit(state.copyWith(libraryPath: value));
  void setScanStrategy(ScanStrategy value) =>
      emit(state.copyWith(scanStrategy: value));

  /// Sets one OTP cell. Web's `useOtpInput.onInput` owns focus movement too;
  /// that stays in the widget, which is where focus nodes live.
  void setDigit(int index, String value) {
    final next = [...state.verifyCode];
    next[index] = value;
    emit(state.copyWith(verifyCode: next));
  }

  Future<void> submitAccount() async {
    emit(state.copyWith(isPending: true, clearStep1Error: true));
    try {
      await _authRepository.signUp(
        // Web: `name: displayName ?? email.split('@')[0] ?? email` — an empty
        // full name falls back to the address' local part rather than posting ''.
        name: state.fullName.isNotEmpty
            ? state.fullName
            : state.email.split('@').first,
        email: state.email,
        password: state.password,
      );
      if (isClosed) return;
      // The first account is promoted to ADMIN server-side by the Better Auth
      // user-create hook — no client-side promotion call needed.
      if (state.config.emailVerificationRequired) {
        emit(state.copyWith(step: SignUpStep.verify, isPending: false));
        _startResendCountdown();
      } else {
        emit(state.copyWith(step: SignUpStep.library, isPending: false));
      }
    } on Object catch (e) {
      if (isClosed) return;
      emit(
        state.copyWith(
          isPending: false,
          step1Error: _isEmailTaken(e)
              ? SignUpError.emailTaken
              : SignUpError.generic,
        ),
      );
    }
  }

  Future<void> submitVerify() async {
    emit(state.copyWith(isPending: true, clearStep2Error: true));
    try {
      await _authRepository.verifyEmail(
        email: state.email,
        code: state.fullCode,
      );
      if (isClosed) return;
      _stopResendCountdown();
      emit(state.copyWith(step: SignUpStep.library, isPending: false));
    } on Object {
      if (isClosed) return;
      emit(
        state.copyWith(isPending: false, step2Error: SignUpError.verifyFailed),
      );
    }
  }

  /// Web: `onResend` — no-op while the countdown is live.
  void resend() {
    if (state.resendCountdown > 0) return;
    // Web sends nothing here either ("Stub: real impl would call
    // authClient.emailVerification.send()"). Wiring it needs the Better Auth
    // `emailOTP` plugin server-side, which the backend does not enable — the
    // same gap that makes `verifyEmail` unreachable. Re-arming the countdown
    // keeps the two clients identical instead of inventing a third behaviour.
    _startResendCountdown();
  }

  /// Web: `onEditEmail` — going back to fix the address must not leave a stale
  /// code or a running countdown behind for the next verify pass.
  void editEmail() {
    _stopResendCountdown();
    emit(
      state.copyWith(
        step: SignUpStep.account,
        verifyCode: const ['', '', '', '', '', ''],
        resendCountdown: 0,
        clearStep2Error: true,
      ),
    );
  }

  Future<void> submitLibrary() async {
    emit(state.copyWith(isPending: true, clearStep3Error: true));
    try {
      await _libraryRepository.registerLibrary(
        name: state.libraryName,
        rootPath: state.libraryPath.trim(),
      );
    } on Object {
      if (isClosed) return;
      // The endpoint is idempotent on rootPath (it auto-grants the user on an
      // existing library), so 409 isn't a code path — anything here is a real
      // failure: bad path, network, etc.
      emit(
        state.copyWith(isPending: false, step3Error: SignUpError.libraryPath),
      );
      return;
    }
    // The backend has already kicked off the initial scan on its side.
    await _finish();
  }

  /// Web: `onSkipLibrary` — straight to home, no library registered.
  Future<void> skipLibrary() => _finish();

  /// Adopts the session created back on step 1 and ends the wizard. Only now
  /// may `AuthGate` see `authenticated` and swap in `MainShell`.
  Future<void> _finish() async {
    await _authCubit.checkSession();
    if (isClosed) return;
    emit(state.copyWith(isPending: false, done: true));
  }

  void _startResendCountdown() {
    _stopResendCountdown();
    emit(state.copyWith(resendCountdown: 60));
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (isClosed) {
        timer.cancel();
        return;
      }
      final next = state.resendCountdown - 1;
      emit(state.copyWith(resendCountdown: next));
      if (next <= 0) _stopResendCountdown();
    });
  }

  void _stopResendCountdown() {
    _resendTimer?.cancel();
    _resendTimer = null;
  }

  /// Web matches Better Auth's `code`, not the message wording — see
  /// [AuthErrorCodes].
  bool _isEmailTaken(Object error) =>
      error is AuthException && error.code == AuthErrorCodes.userAlreadyExists;

  @override
  Future<void> close() {
    _resendTimer?.cancel();
    return super.close();
  }
}

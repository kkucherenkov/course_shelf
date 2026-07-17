import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_exception.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_in_state.dart';

/// Form state + validation for the sign-in screen.
///
/// Owns no session of its own — the credential call is delegated to the
/// app-level [AuthCubit] (E15-F01-S03), which is the instance `AuthGate`
/// watches. Anything else would authenticate a session the gate cannot see.
///
/// Mirrors `apps/web/app/pages/sign-in.vue`, with one deliberate difference:
/// web disables the submit button while `!formValid`, so its
/// `errorEmailInvalid` / `errorPasswordTooShort` strings are unreachable. On a
/// phone a dead button with no explanation is worse than a message, so the CTA
/// stays live and [submit] validates — the behaviour E15-F01-S03 already
/// shipped and its screen test pins.
class SignInCubit extends Cubit<SignInState> {
  SignInCubit({
    required AuthCubit authCubit,
    required InstanceRepository instanceRepository,
  }) : _authCubit = authCubit,
       _instanceRepository = instanceRepository,
       super(const SignInState());

  final AuthCubit _authCubit;
  final InstanceRepository _instanceRepository;

  Timer? _rateLimitTimer;

  /// Web mirrors this with `useInstanceConfig()` firing on setup. The probe
  /// never throws — it falls back to [InstanceConfig.defaults].
  Future<void> start() async {
    final config = await _instanceRepository.getInstanceConfig();
    if (isClosed) return;
    emit(state.copyWith(config: config));
  }

  void setEmail(String value) => emit(state.copyWith(email: value));
  void setPassword(String value) => emit(state.copyWith(password: value));
  void setKeepSignedIn(bool value) => emit(state.copyWith(keepSignedIn: value));

  /// Web: `onSignIn`.
  Future<void> submit() async {
    if (state.isRateLimited) return;
    emit(state.copyWith(clearError: true));

    if (!state.emailValid) {
      emit(state.copyWith(errorMessage: SignInError.emailInvalid));
      return;
    }
    if (!state.passwordValid) {
      emit(state.copyWith(errorMessage: SignInError.passwordTooShort));
      return;
    }

    emit(state.copyWith(isPending: true));
    await _authCubit.signIn(email: state.email, password: state.password);
    if (isClosed) return;

    final auth = _authCubit.state;
    if (auth.status != AuthStatus.error) {
      // Success: AuthGate rebuilds into the shell off the same cubit; this
      // screen is on its way out, so there is nothing more to emit.
      emit(state.copyWith(isPending: false));
      return;
    }

    if (auth.statusCode == 429) {
      // Web: `rateLimitSec.value = result.retryAfter ?? 60`.
      _startRateLimit(auth.retryAfterSeconds ?? 60);
      return;
    }

    emit(
      state.copyWith(
        isPending: false,
        errorMessage: auth.errorCode == AuthErrorCodes.invalidCredentials
            ? SignInError.invalidCredentials
            : SignInError.generic,
      ),
    );
  }

  /// Web: `onRateLimitExpired` — its `RateLimitBanner` owns the countdown and
  /// emits `expired`. Mobile keeps the tick here so it is unit-testable and so
  /// the banner stays a dumb catalog widget.
  void _startRateLimit(int seconds) {
    _rateLimitTimer?.cancel();
    emit(
      state.copyWith(
        isPending: false,
        rateLimitSeconds: seconds,
        clearError: true,
      ),
    );
    _rateLimitTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (isClosed) {
        timer.cancel();
        return;
      }
      final next = (state.rateLimitSeconds ?? 0) - 1;
      if (next <= 0) {
        timer.cancel();
        _rateLimitTimer = null;
        emit(state.copyWith(clearRateLimit: true));
        return;
      }
      emit(state.copyWith(rateLimitSeconds: next));
    });
  }

  @override
  Future<void> close() {
    _rateLimitTimer?.cancel();
    return super.close();
  }
}

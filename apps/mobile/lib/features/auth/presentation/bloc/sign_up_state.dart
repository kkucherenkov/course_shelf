import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/auth/domain/instance_config.dart';

/// The wizard's logical steps. `verify` is conditional on
/// [InstanceConfig.emailVerificationRequired] — same as web's
/// `type StepId = 'account' | 'verify' | 'library'`.
enum SignUpStep { account, verify, library }

/// Cover-art strategy offered on step 3.
///
/// Collected but deliberately NOT sent: web's `onLibrarySubmit` posts only
/// `{ name, rootPath }` to `registerLibrary`, and `RegisterLibraryRequest` has
/// no strategy field. Mirrored here rather than "fixed" so the two clients stay
/// identical; making it mean something is a backend/spec change.
enum ScanStrategy { auto, frame, skip }

/// Per-step failure codes.
///
/// Web stores an already-localized *string* in `step1Error` (its page calls
/// `t()` at the point of failure). A Cubit has no `BuildContext` and must not
/// import slang, so the state carries the code and the screen localizes it.
/// This is the one deliberate departure from web's field types — the field
/// names, their per-step split, and every transition are unchanged.
enum SignUpError {
  /// Better Auth `USER_ALREADY_EXISTS` — web's `AUTH_ERROR_CODES`.
  emailTaken,

  /// Any other sign-up failure. Web: `t('pages.signUp.errorGeneric')`.
  generic,

  /// Step 2: the code was rejected.
  verifyFailed,

  /// Step 3: `registerLibrary` rejected the path.
  libraryPath,
}

/// Mirrors the reactive state of `apps/web/app/pages/sign-up.vue` field for
/// field — the card requires an identical shape. Web holds these as separate
/// `ref`s; a Cubit needs one immutable object, so they are gathered here with
/// the same names and the same per-step error split (`step1Error`/`step2Error`/
/// `step3Error` rather than one shared error).
class SignUpState extends Equatable {
  const SignUpState({
    this.step = SignUpStep.account,
    this.fullName = '',
    this.email = '',
    this.password = '',
    this.step1Error,
    this.verifyCode = const ['', '', '', '', '', ''],
    this.resendCountdown = 0,
    this.step2Error,
    this.libraryName = '',
    this.libraryPath = '',
    this.scanStrategy = ScanStrategy.auto,
    this.step3Error,
    this.isPending = false,
    this.isFirstAdmin = false,
    this.config = InstanceConfig.defaults,
    this.done = false,
  });

  final SignUpStep step;

  // ── Step 1 — Account ──────────────────────────────────────────────────────
  final String fullName;
  final String email;
  final String password;
  final SignUpError? step1Error;

  // ── Step 2 — Verify ───────────────────────────────────────────────────────
  /// Six single-character cells, mirroring web's `useOtpInput` digits array.
  final List<String> verifyCode;

  /// Seconds until "Resend" re-arms. Web starts this at 60 on entering the
  /// step and ticks it down; 0 means the resend link is live.
  final int resendCountdown;
  final SignUpError? step2Error;

  // ── Step 3 — Library ──────────────────────────────────────────────────────
  final String libraryName;
  final String libraryPath;
  final ScanStrategy scanStrategy;
  final SignUpError? step3Error;

  // ── Ambient ───────────────────────────────────────────────────────────────
  /// True while a submit is in flight (web reads `authStore.isPending`).
  final bool isPending;

  /// `hasUsers === false` — this account bootstraps the first admin, which
  /// swaps step 1's title/subtitle. Web: `isFirstAdmin` computed.
  final bool isFirstAdmin;

  final InstanceConfig config;

  /// Set once the wizard is finished and the caller should leave for home.
  /// Web navigates imperatively (`navigateTo('/')`); a Cubit cannot, so it
  /// raises a flag the screen listens for.
  final bool done;

  /// Web: `fullCode` computed.
  String get fullCode => verifyCode.join();

  /// Web: `visibleSteps` computed. Returns ids; the screen supplies labels via
  /// slang, keeping user-visible strings out of the state.
  List<SignUpStep> get visibleSteps => config.emailVerificationRequired
      ? const [SignUpStep.account, SignUpStep.verify, SignUpStep.library]
      : const [SignUpStep.account, SignUpStep.library];

  /// Web: `:disabled="!email || !password || password.length < 8"`.
  bool get canSubmitAccount =>
      email.isNotEmpty && password.isNotEmpty && password.length >= 8;

  /// Web: `:disabled="fullCode.length < 6"`.
  bool get canSubmitVerify => fullCode.length >= 6;

  /// Web: `:disabled="!libraryName || !libraryPath"`.
  bool get canSubmitLibrary => libraryName.isNotEmpty && libraryPath.isNotEmpty;

  /// Errors clear via the explicit `clearStepNError` flags, never by omission.
  /// `AuthState.copyWith` uses the opposite convention (passing nothing clears);
  /// that is unusable here because the resend countdown emits once a second and
  /// would silently wipe a visible `step2Error` on the next tick.
  SignUpState copyWith({
    SignUpStep? step,
    String? fullName,
    String? email,
    String? password,
    SignUpError? step1Error,
    bool clearStep1Error = false,
    List<String>? verifyCode,
    int? resendCountdown,
    SignUpError? step2Error,
    bool clearStep2Error = false,
    String? libraryName,
    String? libraryPath,
    ScanStrategy? scanStrategy,
    SignUpError? step3Error,
    bool clearStep3Error = false,
    bool? isPending,
    bool? isFirstAdmin,
    InstanceConfig? config,
    bool? done,
  }) {
    return SignUpState(
      step: step ?? this.step,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      password: password ?? this.password,
      step1Error: clearStep1Error ? null : (step1Error ?? this.step1Error),
      verifyCode: verifyCode ?? this.verifyCode,
      resendCountdown: resendCountdown ?? this.resendCountdown,
      step2Error: clearStep2Error ? null : (step2Error ?? this.step2Error),
      libraryName: libraryName ?? this.libraryName,
      libraryPath: libraryPath ?? this.libraryPath,
      scanStrategy: scanStrategy ?? this.scanStrategy,
      step3Error: clearStep3Error ? null : (step3Error ?? this.step3Error),
      isPending: isPending ?? this.isPending,
      isFirstAdmin: isFirstAdmin ?? this.isFirstAdmin,
      config: config ?? this.config,
      done: done ?? this.done,
    );
  }

  @override
  List<Object?> get props => [
    step,
    fullName,
    email,
    password,
    step1Error,
    verifyCode,
    resendCountdown,
    step2Error,
    libraryName,
    libraryPath,
    scanStrategy,
    step3Error,
    isPending,
    isFirstAdmin,
    config,
    done,
  ];
}

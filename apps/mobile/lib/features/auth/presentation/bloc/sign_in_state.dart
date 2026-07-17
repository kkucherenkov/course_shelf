import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/auth/domain/instance_config.dart';

/// Sign-in failure codes. See `SignUpError` for why these are codes and not
/// pre-localized strings.
enum SignInError {
  /// Client-side: web's `t('pages.signIn.errorEmailInvalid')`.
  emailInvalid,

  /// Client-side: web's `t('pages.signIn.errorPasswordTooShort')`.
  passwordTooShort,

  /// Better Auth `INVALID_EMAIL_OR_PASSWORD`.
  invalidCredentials,

  /// Anything else.
  generic,
}

/// Mirrors the reactive state of `apps/web/app/pages/sign-in.vue`.
class SignInState extends Equatable {
  const SignInState({
    this.email = '',
    this.password = '',
    this.keepSignedIn = false,
    this.errorMessage,
    this.rateLimitSeconds,
    this.isPending = false,
    this.config = InstanceConfig.defaults,
  });

  final String email;
  final String password;

  /// Web: `keepSignedIn` — passed to Better Auth as `rememberMe`.
  final bool keepSignedIn;

  final SignInError? errorMessage;

  /// Web: `rateLimitSec` — non-null blocks submit and shows the countdown
  /// banner instead of the error banner.
  final int? rateLimitSeconds;

  final bool isPending;

  /// Gates the sign-up CTA (`selfRegistration`) and the SSO row
  /// (`ssoProviders`).
  final InstanceConfig config;

  /// Web: `emailValid` computed.
  bool get emailValid => email.contains('@') && email.length >= 5;

  /// Web: `passwordValid` computed.
  bool get passwordValid => password.length >= 8;

  /// Web: `formValid` computed.
  bool get formValid => emailValid && passwordValid;

  /// True while the rate-limit window is open.
  bool get isRateLimited => rateLimitSeconds != null;

  SignInState copyWith({
    String? email,
    String? password,
    bool? keepSignedIn,
    SignInError? errorMessage,
    bool clearError = false,
    int? rateLimitSeconds,
    bool clearRateLimit = false,
    bool? isPending,
    InstanceConfig? config,
  }) {
    return SignInState(
      email: email ?? this.email,
      password: password ?? this.password,
      keepSignedIn: keepSignedIn ?? this.keepSignedIn,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      rateLimitSeconds: clearRateLimit
          ? null
          : (rateLimitSeconds ?? this.rateLimitSeconds),
      isPending: isPending ?? this.isPending,
      config: config ?? this.config,
    );
  }

  @override
  List<Object?> get props => [
    email,
    password,
    keepSignedIn,
    errorMessage,
    rateLimitSeconds,
    isPending,
    config,
  ];
}

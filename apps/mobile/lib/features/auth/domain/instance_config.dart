import 'package:equatable/equatable.dart';

/// Server-advertised auth capabilities, from `GET /api/v1/admin/instance`.
///
/// Mirrors web's `InstanceConfigDto` / `useInstanceConfig` composable, including
/// its fallback policy: the UI must never hard-block on a transient probe
/// failure, so callers fall back to [InstanceConfig.defaults].
class InstanceConfig extends Equatable {
  const InstanceConfig({
    required this.selfRegistration,
    required this.emailVerificationRequired,
    required this.ssoProviders,
  });

  /// Safe defaults used while the probe is in flight and when it fails —
  /// identical to web's `DEFAULT_CONFIG`.
  static const defaults = InstanceConfig(
    selfRegistration: true,
    emailVerificationRequired: false,
    ssoProviders: <String>[],
  );

  /// Gates the sign-up CTA on sign-in and the whole sign-up wizard.
  final bool selfRegistration;

  /// Gates the sign-up wizard's `verify` step. v1 ships `false`
  /// (`AUTH_EMAIL_VERIFICATION` on the backend).
  final bool emailVerificationRequired;

  /// Gates the SSO row. v1 ships `[]`, so the row normally does not render.
  final List<String> ssoProviders;

  @override
  List<Object?> get props => [
    selfRegistration,
    emailVerificationRequired,
    ssoProviders,
  ];
}

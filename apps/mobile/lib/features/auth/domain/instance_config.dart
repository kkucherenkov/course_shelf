import 'package:equatable/equatable.dart';

/// Server-advertised auth capabilities, from `GET /api/v1/admin/instance`.
///
/// Mirrors web's `InstanceConfigDto` / `useInstanceConfig` composable, including
/// its fallback policy: the UI must never hard-block on a transient probe
/// failure, so callers fall back to [InstanceConfig.defaults].
/// One provider advertised by the server, rendered as an `AppSsoBlock` button.
///
/// The server owns the copy — `SsoProviderConfig` in `openapi.yaml` requires
/// `id`, `label` and `iconName` — so the client renders what it is given rather
/// than mapping ids to labels of its own.
class SsoProviderConfig extends Equatable {
  const SsoProviderConfig({
    required this.id,
    required this.label,
    required this.iconName,
  });

  /// Parses one wire object, skipping any that is missing a required field
  /// rather than failing the whole probe for one bad entry.
  static SsoProviderConfig? tryParse(Object? raw) {
    if (raw is! Map<String, dynamic>) return null;
    final String? id = raw['id'] as String?;
    final String? label = raw['label'] as String?;
    final String? iconName = raw['iconName'] as String?;
    if (id == null || label == null || iconName == null) return null;
    return SsoProviderConfig(id: id, label: label, iconName: iconName);
  }

  final String id;
  final String label;
  final String iconName;

  @override
  List<Object?> get props => [id, label, iconName];
}

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
    ssoProviders: <SsoProviderConfig>[],
  );

  /// Gates the sign-up CTA on sign-in and the whole sign-up wizard.
  final bool selfRegistration;

  /// Gates the sign-up wizard's `verify` step. v1 ships `false`
  /// (`AUTH_EMAIL_VERIFICATION` on the backend).
  final bool emailVerificationRequired;

  /// Gates the SSO row. v1 ships `[]`, so the row normally does not render.
  final List<SsoProviderConfig> ssoProviders;

  @override
  List<Object?> get props => [
    selfRegistration,
    emailVerificationRequired,
    ssoProviders,
  ];
}

import 'package:app_ui/app_ui.dart';

import 'package:app_mobile/features/auth/domain/instance_config.dart';

/// Adapts the providers advertised by `GET /admin/instance` to what
/// [AppSsoBlock] renders.
///
/// **The server owns the copy.** `SsoProviderConfig` in `openapi.yaml` requires
/// `label` and `iconName` alongside `id`, and the spec says the array "lights
/// up the SsoBlock without UI changes". So there is deliberately no id→label
/// mapping here any more — the previous version localized `google`/`github`
/// itself and ignored whatever the operator had configured, which would have
/// overridden a real label with a guess.
///
/// The only work left is narrowing `iconName` off the wire to the [IconName]
/// enum. An unrecognised glyph falls back to [IconName.key] so a provider an
/// operator adds is visibly usable rather than blank. The recognised set is the
/// three the design bundle documents for SSO — `IconName` has no Google mark,
/// so `mail` stands in there, on the web, and in
/// `lib/widgetbook/sso_block_catalog.dart`.
///
/// v1 ships `ssoProviders: []`, so this normally returns an empty list and the
/// SSO row does not render at all.
List<SsoProvider> ssoProvidersFor(List<SsoProviderConfig> providers) {
  return [
    for (final p in providers)
      SsoProvider(id: p.id, label: p.label, iconName: _glyphFor(p.iconName)),
  ];
}

IconName _glyphFor(String raw) => switch (raw) {
  'mail' => IconName.mail,
  'github' => IconName.github,
  _ => IconName.key,
};

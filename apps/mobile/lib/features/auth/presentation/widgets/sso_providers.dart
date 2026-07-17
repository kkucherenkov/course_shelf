import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Maps the provider ids advertised by `GET /admin/instance`
/// (`instance.ssoProviders`) onto renderable [SsoProvider] records.
///
/// `AppSsoBlock` takes labels as plain strings with English defaults, per the
/// catalog convention — so localizing them is this (app-layer) function's job.
/// Icons follow the same id→glyph choices as `lib/widgetbook/sso_block_catalog.dart`
/// (`IconName` has no Google mark; `mail` stands in there and here).
///
/// v1 ships `ssoProviders: []`, so this normally returns an empty list and the
/// SSO row does not render at all. Unknown ids still get a button — a generic
/// "Single sign-on" one — rather than being dropped, so a server that adds a
/// provider is not silently unusable on mobile.
List<SsoProvider> ssoProvidersFor(BuildContext context, List<String> ids) {
  final t = context.t.auth.sso;
  return [
    for (final id in ids)
      SsoProvider(
        id: id,
        label: switch (id) {
          'google' => t.google,
          'github' => t.github,
          _ => t.generic,
        },
        iconName: switch (id) {
          'google' => IconName.mail,
          'github' => IconName.github,
          _ => IconName.key,
        },
      ),
  ];
}

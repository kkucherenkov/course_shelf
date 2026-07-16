import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing `AppSsoBlock` — one [WidgetbookComponent]
/// with one use case per provider-list size (all providers, a two-provider
/// subset, a single provider), mirroring the web `AppSsoBlock.stories.ts`
/// fixtures (`Default` / two-provider-ish subsets / single-provider stories).
WidgetbookComponent buildSsoBlockComponent() {
  return WidgetbookComponent(
    name: 'AppSsoBlock',
    useCases: [
      WidgetbookUseCase(name: 'All providers', builder: _allProviders),
      WidgetbookUseCase(name: 'Subset', builder: _subset),
      WidgetbookUseCase(name: 'Single provider', builder: _single),
    ],
  );
}

const _google = SsoProvider(
  id: 'google',
  label: 'Continue with Google',
  iconName: IconName.mail,
);
const _github = SsoProvider(
  id: 'github',
  label: 'Continue with GitHub',
  iconName: IconName.github,
);
const _sso = SsoProvider(
  id: 'sso',
  label: 'Single sign-on',
  iconName: IconName.key,
);

Widget _frame(Widget child) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(width: 320, child: child),
  ),
);

Widget _allProviders(BuildContext context) => _frame(
  AppSsoBlock(
    providers: const <SsoProvider>[_google, _github, _sso],
    onSelect: (_) {},
  ),
);

Widget _subset(BuildContext context) => _frame(
  AppSsoBlock(
    providers: const <SsoProvider>[_google, _github],
    onSelect: (_) {},
  ),
);

Widget _single(BuildContext context) => _frame(
  AppSsoBlock(providers: const <SsoProvider>[_github], onSelect: (_) {}),
);

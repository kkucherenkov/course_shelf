import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A single SSO provider offered by an [AppSsoBlock] — Flutter twin of the
/// web `SsoProvider` interface
/// (`packages/ui/src/components/AppSsoBlock/AppSsoBlock.vue`).
///
/// The web defines no closed provider union: callers hand the component an
/// arbitrary list of `{ id, label, iconName }` records (see
/// `AppSsoBlock.stories.ts`'s `google` / `github` / `sso` fixtures). This twin
/// mirrors that open shape as a plain model class rather than inventing a
/// fixed Dart enum of providers.
class SsoProvider {
  const SsoProvider({
    required this.id,
    required this.label,
    required this.iconName,
  });

  /// Stable identifier — passed to [AppSsoBlock.onSelect] so the caller can
  /// dispatch the right sign-in flow.
  final String id;

  /// Visible label (e.g. "Continue with Google").
  final String label;

  /// Icon glyph from the [IconName] family.
  final IconName iconName;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SsoProvider &&
          other.id == id &&
          other.label == label &&
          other.iconName == iconName);

  @override
  int get hashCode => Object.hash(id, label, iconName);
}

/// A vertical list of full-width SSO provider buttons — Flutter twin of the
/// web `AppSsoBlock`
/// (`packages/ui/src/components/AppSsoBlock/AppSsoBlock.vue`).
///
/// Purely presentational: [providers] in, [onSelect] out. Composes
/// [AppButton] (`variant: secondary`, `block: true`) with each provider's
/// [SsoProvider.iconName] as the leading icon — no button re-implementation.
///
/// ## Web parity
/// - Renders nothing when [providers] is empty, matching the web's
///   `v-if="providers.length > 0"`.
/// - `role="group"` + `aria-label="Sign in with"` on the wrapper ->
///   `Semantics(container: true, label: 'Sign in with')`. [SemanticsRole]
///   (`dart:ui`) has no ARIA-`group`-equivalent constant in this Flutter SDK
///   (only narrower roles like `radioGroup`/`tabBar`), so this twin conveys
///   the same "labelled group of controls" semantics via a plain labelled
///   container node instead of a role, same as e.g. Flutter's own
///   `Semantics(container: true, ...)` idiom for ungrouped ARIA `group`. The
///   web hardcodes this label with no prop to override it; this twin matches
///   that 1:1.
/// - `gap: var(--space-2)` between buttons -> [AppSpacing.s2] between rows.
///
/// ## Deviation: no "or" divider
/// `AppSsoBlock.vue` has no divider prop or markup — it is a plain list of
/// buttons. This twin matches 1:1 and does not add one.
class AppSsoBlock extends StatelessWidget {
  const AppSsoBlock({required this.providers, this.onSelect, super.key});

  /// The providers rendered as a vertical list, in order.
  final List<SsoProvider> providers;

  /// Called with a provider's [SsoProvider.id] when its button is tapped.
  final ValueChanged<String>? onSelect;

  @override
  Widget build(BuildContext context) {
    if (providers.isEmpty) return const SizedBox.shrink();

    final children = <Widget>[];
    for (var i = 0; i < providers.length; i++) {
      if (i > 0) children.add(const SizedBox(height: AppSpacing.s2));
      final provider = providers[i];
      children.add(
        AppButton(
          key: ValueKey<String>(provider.id),
          label: provider.label,
          variant: AppButtonVariant.secondary,
          block: true,
          iconLeading: provider.iconName,
          onPressed: onSelect == null ? null : () => onSelect!(provider.id),
        ),
      );
    }

    return Semantics(
      container: true,
      label: 'Sign in with',
      child: Column(mainAxisSize: MainAxisSize.min, children: children),
    );
  }
}

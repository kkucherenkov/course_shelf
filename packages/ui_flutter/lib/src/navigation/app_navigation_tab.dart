import 'package:flutter/widgets.dart';

import 'package:app_ui/src/icons/icon_name.dart';

/// One tab in an [AppNavigationShell]'s bottom-tab bar.
///
/// Mirrors the web `AppNavigationShell`'s `NavItem` (`label`, `icon`), minus
/// `key`/`to` (the Flutter shell is controlled purely by index — no
/// framework-agnostic router key is needed) plus two Flutter-side additions:
/// [filledIcon] (an active-state glyph swap; the web shell only recolours
/// the same glyph) and [body] (the tab's content — the web shell instead
/// takes its main content via a default slot, since it has no `IndexedStack`
/// equivalent to hold five bodies at once).
@immutable
class AppNavigationTab {
  const AppNavigationTab({
    required this.label,
    required this.icon,
    required this.body,
    this.filledIcon,
  });

  /// Rendered under the glyph in the bottom-tab bar and used as the
  /// collapsing large title when this tab is active (unless
  /// `AppNavigationShell.title` overrides it).
  final String label;

  /// The outline glyph, shown when this tab is NOT active (and when active,
  /// if [filledIcon] is null).
  final IconName icon;

  /// The glyph shown while this tab IS active, when the brand icon family
  /// has a distinct filled counterpart for it. Null falls back to [icon] —
  /// do not invent a glyph that isn't in [IconName].
  final IconName? filledIcon;

  /// The tab's content, scrolled beneath the platform-adaptive app bar.
  final Widget body;
}

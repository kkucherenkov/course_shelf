import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/navigation/app_navigation_tab.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The persistent mobile shell: a 5-tab bottom bar over an [IndexedStack] of
/// tab bodies, each fronted by a platform-adaptive collapsing title.
///
/// The mobile-only twin of the web `AppNavigationShell` (whose xs-width
/// bottom-tab bar this reuses the visual language of — active tab colour is
/// `colorScheme.primary`, inactive is `colorScheme.onSurfaceVariant`,
/// matching the web `--brand-accent` / `--text-secondary`). The
/// platform-adaptive collapsing-title chrome is net-new for mobile; the web
/// shell has no equivalent (DESIGN_BRIEF §7, §7.1).
///
/// Controlled: the caller owns [currentIndex] and receives [onTabChanged]
/// rather than the shell holding its own selection state.
///
/// ## Scroll-ownership decision (approved design, option (a))
/// Per tab, the shell composes a single `CustomScrollView`: the platform app
/// bar sliver (`CupertinoSliverNavigationBar` on iOS, `SliverAppBar.large` on
/// Android) followed by [AppNavigationTab.body] wrapped in a
/// `SliverToBoxAdapter`. The shell owns the sliver app bar; the tab body
/// stays a plain [Widget] — not a caller-supplied sliver — which keeps the
/// prop surface exactly `{ label, icon, filledIcon, body }`. Every tab gets
/// its own `CustomScrollView`, so nothing here is a shared/global
/// `ScrollController`: tab A's large-title collapse never touches tab B's
/// scroll offset. Tab subtrees build lazily on first visit and then stay
/// mounted inside the [IndexedStack], so scroll position and widget state
/// survive switching tabs.
class AppNavigationShell extends StatefulWidget {
  const AppNavigationShell({
    required this.tabs,
    required this.currentIndex,
    required this.onTabChanged,
    this.title,
    super.key,
  }) : assert(tabs.length > 0, 'AppNavigationShell needs at least one tab'),
       assert(
         currentIndex >= 0 && currentIndex < tabs.length,
         'currentIndex must index into tabs',
       );

  /// The bottom-bar tabs, in display order. Designed for the 5-tab set from
  /// DESIGN_BRIEF §7.1 (Home · Browse · Downloads · Search · Settings), but
  /// the widget itself is generic over the count.
  final List<AppNavigationTab> tabs;

  /// Index of the active tab (controlled).
  final int currentIndex;

  /// Fired with the tapped index; the caller updates [currentIndex] in
  /// response.
  final ValueChanged<int> onTabChanged;

  /// Overrides the active tab's own [AppNavigationTab.label] as the large
  /// title. When null, the active tab's label is used.
  final String? title;

  @override
  State<AppNavigationShell> createState() => _AppNavigationShellState();
}

class _AppNavigationShellState extends State<AppNavigationShell> {
  late final Set<int> _builtIndices = <int>{widget.currentIndex};

  @override
  void didUpdateWidget(covariant AppNavigationShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    _builtIndices.add(widget.currentIndex);
  }

  @override
  Widget build(BuildContext context) {
    final bool isIOS = Theme.of(context).platform == TargetPlatform.iOS;

    return Scaffold(
      body: IndexedStack(
        index: widget.currentIndex,
        children: <Widget>[
          for (int i = 0; i < widget.tabs.length; i++)
            _builtIndices.contains(i)
                ? _TabScrollView(
                    isIOS: isIOS,
                    title: i == widget.currentIndex
                        ? (widget.title ?? widget.tabs[i].label)
                        : widget.tabs[i].label,
                    body: widget.tabs[i].body,
                  )
                // Lazy first build: an unvisited tab is a zero-cost
                // placeholder until [currentIndex] reaches it, at which
                // point it's built once and stays mounted (state/scroll
                // position preserved by the IndexedStack).
                : const SizedBox.shrink(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        // A stable key so callers (and tests) can scope a lookup to the
        // bottom-tab bar specifically — a tab's own label text can also
        // appear as the platform app bar's title when that tab is active,
        // so an unscoped `find.text(label)` is ambiguous.
        key: const ValueKey<String>('appNavigationShellBottomBar'),
        top: false,
        child: _AppBottomTabBar(
          tabs: widget.tabs,
          currentIndex: widget.currentIndex,
          onChanged: widget.onTabChanged,
        ),
      ),
    );
  }
}

/// One tab's scroll view: the platform app bar sliver + its body.
class _TabScrollView extends StatelessWidget {
  const _TabScrollView({
    required this.isIOS,
    required this.title,
    required this.body,
  });

  final bool isIOS;
  final String title;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;

    // `CupertinoSliverNavigationBar` resolves its own default text style from
    // `CupertinoTheme`, not `Theme.of(context).textTheme` — left unstyled it
    // renders in the platform's native font instead of the brand's IBM Plex
    // Sans (and, with that font unregistered outside a real iOS run, as
    // untranslated tofu). Style both title widgets explicitly so the large
    // title matches `SliverAppBar.large`'s (theme-default) look on Android.
    final TextStyle largeTitleStyle =
        (theme.textTheme.headlineMedium ?? const TextStyle()).copyWith(
          color: cs.onSurface,
        );
    final TextStyle middleTitleStyle =
        (theme.textTheme.titleLarge ?? const TextStyle()).copyWith(
          color: cs.onSurface,
        );

    return SafeArea(
      bottom: false,
      child: CustomScrollView(
        slivers: <Widget>[
          if (isIOS)
            CupertinoSliverNavigationBar(
              largeTitle: Text(title, style: largeTitleStyle),
              middle: Text(title, style: middleTitleStyle),
              backgroundColor: cs.surface,
              border: Border(bottom: BorderSide(color: cs.outline)),
              // The shell is a tab root, not a pushed route — no back
              // chevron.
              automaticallyImplyLeading: false,
              // Several tab scroll views can be mounted at once (lazy-built,
              // then kept alive by the IndexedStack); disable hero-based
              // route transitions so multiple same-tag nav bars never
              // collide mid-transition. Tab switching is owned by
              // IndexedStack, not Navigator push/pop, so no transition is
              // needed anyway.
              transitionBetweenRoutes: false,
            )
          else
            SliverAppBar.large(
              title: Text(title),
              automaticallyImplyLeading: false,
            ),
          SliverToBoxAdapter(child: body),
        ],
      ),
    );
  }
}

/// The bottom-tab bar: one [_AppTabBarItem] per tab, evenly spaced.
class _AppBottomTabBar extends StatelessWidget {
  const _AppBottomTabBar({
    required this.tabs,
    required this.currentIndex,
    required this.onChanged,
  });

  final List<AppNavigationTab> tabs;
  final int currentIndex;
  final ValueChanged<int> onChanged;

  /// Web hardcodes `height: 64px` on `.app-navigation-shell__bottom-tabs` —
  /// reproduced verbatim (not a spacing-token multiple).
  static const double _barHeight = 64;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(top: BorderSide(color: cs.outline)),
      ),
      child: SizedBox(
        height: _barHeight,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            for (int i = 0; i < tabs.length; i++)
              Expanded(
                child: _AppTabBarItem(
                  tab: tabs[i],
                  selected: i == currentIndex,
                  onTap: () => onChanged(i),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AppTabBarItem extends StatelessWidget {
  const _AppTabBarItem({
    required this.tab,
    required this.selected,
    required this.onTap,
  });

  final AppNavigationTab tab;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final Color color = selected ? cs.primary : cs.onSurfaceVariant;
    final IconName glyph = selected ? (tab.filledIcon ?? tab.icon) : tab.icon;

    final TextStyle labelStyle =
        (theme.textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.xs,
          fontWeight: selected ? AppFontWeight.semibold : AppFontWeight.medium,
          color: color,
        );

    return Semantics(
      selected: selected,
      button: true,
      label: tab.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s1,
              vertical: AppSpacing.s2,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconCS(name: glyph, size: 24, color: color),
                const SizedBox(height: AppSpacing.s1),
                Text(tab.label, style: labelStyle),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

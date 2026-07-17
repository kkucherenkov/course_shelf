import 'dart:ui' show Tristate;

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

List<AppNavigationTab> _tabs() => const <AppNavigationTab>[
  AppNavigationTab(
    label: 'Home',
    icon: IconName.home,
    body: Center(child: Text('Home body')),
  ),
  AppNavigationTab(
    label: 'Browse',
    icon: IconName.library,
    body: Center(child: Text('Browse body')),
  ),
  AppNavigationTab(
    label: 'Downloads',
    icon: IconName.download,
    body: Center(child: Text('Downloads body')),
  ),
  AppNavigationTab(
    label: 'Search',
    icon: IconName.search,
    body: Center(child: Text('Search body')),
  ),
  AppNavigationTab(
    label: 'Settings',
    icon: IconName.settings,
    body: Center(child: Text('Settings body')),
  ),
];

/// The same 5 tabs, but with [onRefresh] on the first (Home) — the only tab
/// E18-F01-S01 asks to be refreshable. Not `const`: the callback is per-test.
List<AppNavigationTab> _refreshableTabs({
  required Future<void> Function() onRefresh,
}) => <AppNavigationTab>[
  AppNavigationTab(
    label: 'Home',
    icon: IconName.home,
    onRefresh: onRefresh,
    body: const Center(child: Text('Home body')),
  ),
  ..._tabs().skip(1),
];

// `ThemeData`'s `platform` defaults to `defaultTargetPlatform` at
// CONSTRUCTION time (see `ThemeData._build`'s `platform ??=
// defaultTargetPlatform`), which itself resolves
// `debugDefaultTargetPlatformOverride` when set. So `AppTheme.light()` must
// be called (i.e. `_pump` invoked) AFTER pinning the override, not the other
// way around — this helper takes no `platform` param on purpose.
Future<void> _pump(
  WidgetTester tester, {
  required int currentIndex,
  required ValueChanged<int> onTabChanged,
  List<AppNavigationTab>? tabs,
  String? title,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: AppNavigationShell(
        tabs: tabs ?? _tabs(),
        currentIndex: currentIndex,
        onTabChanged: onTabChanged,
        title: title,
      ),
    ),
  );
}

/// A tab's own label can ALSO appear as the platform app bar's title when
/// that tab is active, so an unscoped `find.text(label)` is ambiguous.
/// Scope the lookup to the bottom-tab bar via its stable key.
Finder _bottomBarText(String label) => find.descendant(
  of: find.byKey(const ValueKey<String>('appNavigationShellBottomBar')),
  matching: find.text(label),
);

void main() {
  // `debugAssertAllFoundationVarsUnset` runs INSIDE the `testWidgets` body
  // (before `tearDown` callbacks fire), so a `tearDown`-only reset is too
  // late — each test that pins `debugDefaultTargetPlatformOverride` also
  // resets it as its own last statement. This global `tearDown` is only a
  // safety net for a test that fails before reaching that reset.
  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  group('AppNavigationShell', () {
    testWidgets('renders all 5 tab labels and glyphs', (tester) async {
      await _pump(tester, currentIndex: 0, onTabChanged: (_) {});

      expect(_bottomBarText('Home'), findsOneWidget);
      expect(_bottomBarText('Browse'), findsOneWidget);
      expect(_bottomBarText('Downloads'), findsOneWidget);
      expect(_bottomBarText('Search'), findsOneWidget);
      expect(_bottomBarText('Settings'), findsOneWidget);

      // One IconCS per tab-bar item; bodies here are plain Text.
      expect(find.byType(IconCS), findsNWidgets(5));
    });

    testWidgets('tapping a tab fires onTabChanged with its index', (
      tester,
    ) async {
      int? tapped;
      await _pump(
        tester,
        currentIndex: 0,
        onTabChanged: (index) => tapped = index,
      );

      await tester.tap(_bottomBarText('Search'));
      expect(tapped, 3);
    });

    testWidgets('active tab renders in colorScheme.primary; inactive in '
        'onSurfaceVariant', (tester) async {
      await _pump(tester, currentIndex: 1, onTabChanged: (_) {});
      final ColorScheme cs = AppTheme.light().colorScheme;

      final Text active = tester.widget<Text>(_bottomBarText('Browse'));
      expect(active.style!.color, cs.primary);

      final Text inactive = tester.widget<Text>(_bottomBarText('Home'));
      expect(inactive.style!.color, cs.onSurfaceVariant);
    });

    testWidgets('active tab shows filledIcon; falls back to icon otherwise', (
      tester,
    ) async {
      await _pump(
        tester,
        currentIndex: 0,
        onTabChanged: (_) {},
        tabs: const <AppNavigationTab>[
          AppNavigationTab(
            label: 'Home',
            icon: IconName.circle,
            filledIcon: IconName.checkCircle,
            body: SizedBox.shrink(),
          ),
          AppNavigationTab(
            label: 'Browse',
            icon: IconName.library,
            body: SizedBox.shrink(),
          ),
        ],
      );

      final icons = tester.widgetList<IconCS>(find.byType(IconCS)).toList();
      expect(icons[0].name, IconName.checkCircle); // active, has filledIcon
      expect(icons[1].name, IconName.library); // inactive, plain icon
    });

    testWidgets('inactive tab with a filledIcon still shows the outline '
        'glyph', (tester) async {
      await _pump(
        tester,
        currentIndex: 1,
        onTabChanged: (_) {},
        tabs: const <AppNavigationTab>[
          AppNavigationTab(
            label: 'Home',
            icon: IconName.circle,
            filledIcon: IconName.checkCircle,
            body: SizedBox.shrink(),
          ),
          AppNavigationTab(
            label: 'Browse',
            icon: IconName.library,
            body: SizedBox.shrink(),
          ),
        ],
      );

      final icons = tester.widgetList<IconCS>(find.byType(IconCS)).toList();
      expect(icons[0].name, IconName.circle); // inactive — outline, not fill
    });

    testWidgets('body reflects currentIndex via the IndexedStack', (
      tester,
    ) async {
      await _pump(tester, currentIndex: 2, onTabChanged: (_) {});
      final IndexedStack stack = tester.widget<IndexedStack>(
        find.byType(IndexedStack),
      );
      expect(stack.index, 2);
      expect(find.text('Downloads body'), findsOneWidget);
    });

    testWidgets('switching currentIndex updates the IndexedStack index', (
      tester,
    ) async {
      int current = 0;
      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) => MaterialApp(
            theme: AppTheme.light(),
            home: AppNavigationShell(
              tabs: _tabs(),
              currentIndex: current,
              onTabChanged: (i) => setState(() => current = i),
            ),
          ),
        ),
      );

      expect(tester.widget<IndexedStack>(find.byType(IndexedStack)).index, 0);

      await tester.tap(_bottomBarText('Settings'));
      await tester.pumpAndSettle();

      expect(tester.widget<IndexedStack>(find.byType(IndexedStack)).index, 4);
      expect(find.text('Settings body'), findsOneWidget);
    });

    testWidgets('exposes each tab as a selected/unselected Semantics button', (
      tester,
    ) async {
      await _pump(tester, currentIndex: 0, onTabChanged: (_) {});
      final selected = tester.getSemantics(_bottomBarText('Home'));
      expect(selected.flagsCollection.isSelected, Tristate.isTrue);
      final unselected = tester.getSemantics(_bottomBarText('Browse'));
      expect(unselected.flagsCollection.isSelected, isNot(Tristate.isTrue));
    });

    testWidgets('each tab item meets the 44x44 minimum hit target', (
      tester,
    ) async {
      await _pump(tester, currentIndex: 0, onTabChanged: (_) {});
      final Size size = tester.getSize(
        find.ancestor(
          of: _bottomBarText('Home'),
          matching: find.byType(InkWell),
        ),
      );
      expect(size.width, greaterThanOrEqualTo(44));
      expect(size.height, greaterThanOrEqualTo(44));
    });

    testWidgets('respects a non-zero top/bottom safe area without '
        'overflowing', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(
            padding: EdgeInsets.only(top: 47, bottom: 34),
          ),
          child: MaterialApp(
            theme: AppTheme.light(),
            home: AppNavigationShell(
              tabs: _tabs(),
              currentIndex: 0,
              onTabChanged: (_) {},
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('an override title replaces the active tab label as the '
        'large title (iOS)', (tester) async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      await _pump(
        tester,
        currentIndex: 0,
        onTabChanged: (_) {},
        title: 'Welcome back',
      );
      final CupertinoSliverNavigationBar bar = tester
          .widget<CupertinoSliverNavigationBar>(
            find.byType(CupertinoSliverNavigationBar),
          );
      expect((bar.largeTitle! as Text).data, 'Welcome back');
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('derives the large title from the active label when no '
        'override is given (iOS)', (tester) async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      await _pump(tester, currentIndex: 1, onTabChanged: (_) {});
      final CupertinoSliverNavigationBar bar = tester
          .widget<CupertinoSliverNavigationBar>(
            find.byType(CupertinoSliverNavigationBar),
          );
      expect((bar.largeTitle! as Text).data, 'Browse');
      debugDefaultTargetPlatformOverride = null;
    });

    group('platform-adaptive chrome', () {
      testWidgets('iOS renders a CupertinoSliverNavigationBar, not a '
          'SliverAppBar', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
        await _pump(tester, currentIndex: 0, onTabChanged: (_) {});
        expect(find.byType(CupertinoSliverNavigationBar), findsOneWidget);
        expect(find.byType(SliverAppBar), findsNothing);
        debugDefaultTargetPlatformOverride = null;
      });

      testWidgets('Android renders a SliverAppBar, not a '
          'CupertinoSliverNavigationBar', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        await _pump(tester, currentIndex: 0, onTabChanged: (_) {});
        expect(find.byType(SliverAppBar), findsOneWidget);
        expect(find.byType(CupertinoSliverNavigationBar), findsNothing);
        debugDefaultTargetPlatformOverride = null;
      });
    });

    // The shell owns a `CustomScrollView` per tab and hands the tab only a
    // `SliverToBoxAdapter` slot, so a tab body physically cannot wrap its own
    // scrollable in a `RefreshIndicator` — the scrollable is its ancestor, not
    // its descendant. Pull-to-refresh therefore has to be the shell's to own
    // (E18-F01-S01 requires it on Home). Adaptive, like the app bar above it.
    group('pull-to-refresh', () {
      testWidgets('Android wraps the tab scroll view in a RefreshIndicator '
          'when onRefresh is set', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        await _pump(
          tester,
          currentIndex: 0,
          onTabChanged: (_) {},
          tabs: _refreshableTabs(onRefresh: () async {}),
        );
        expect(find.byType(RefreshIndicator), findsOneWidget);
        debugDefaultTargetPlatformOverride = null;
      });

      testWidgets('iOS uses a CupertinoSliverRefreshControl, not a '
          'RefreshIndicator', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
        await _pump(
          tester,
          currentIndex: 0,
          onTabChanged: (_) {},
          tabs: _refreshableTabs(onRefresh: () async {}),
        );
        // `skipOffstage: false` is load-bearing: at rest the control has ZERO
        // extent (it lives in the overscroll area above the viewport's leading
        // edge and renders nothing until pulled), so the default finder skips
        // it as offstage and reports the same "not found" a missing widget
        // would. Without this flag the assertion cannot tell the two apart.
        expect(
          find.byType(CupertinoSliverRefreshControl, skipOffstage: false),
          findsOneWidget,
        );
        expect(find.byType(RefreshIndicator), findsNothing);
        debugDefaultTargetPlatformOverride = null;
      });

      // Both platforms: a `findsNothing` on the Cupertino control would pass
      // vacuously on Android (where it never renders anyway), so assert the
      // absence on the platform that COULD have produced one. `skipOffstage`
      // stays false for the same reason as above — otherwise this guard is
      // green whether or not the control is there.
      for (final TargetPlatform platform in <TargetPlatform>[
        TargetPlatform.android,
        TargetPlatform.iOS,
      ]) {
        testWidgets('a tab with no onRefresh gets no refresh affordance '
            '($platform)', (tester) async {
          debugDefaultTargetPlatformOverride = platform;
          await _pump(tester, currentIndex: 0, onTabChanged: (_) {});
          expect(find.byType(RefreshIndicator, skipOffstage: false), findsNothing);
          expect(
            find.byType(CupertinoSliverRefreshControl, skipOffstage: false),
            findsNothing,
          );
          debugDefaultTargetPlatformOverride = null;
        });
      }

      testWidgets('dragging the tab body down fires onRefresh (Android)', (
        tester,
      ) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        var refreshed = 0;
        await _pump(
          tester,
          currentIndex: 0,
          onTabChanged: (_) {},
          tabs: _refreshableTabs(onRefresh: () async => refreshed++),
        );

        await tester.fling(
          find.text('Home body'),
          const Offset(0, 300),
          1000,
        );
        // Not `pumpAndSettle`: the indicator's spinner animates indefinitely
        // while the refresh future is in flight, which never settles.
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));

        expect(refreshed, 1);
        debugDefaultTargetPlatformOverride = null;
      });

      testWidgets('refresh is per-tab: pulling Home never fires Browse\'s '
          'onRefresh', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        var home = 0;
        var browse = 0;
        await _pump(
          tester,
          currentIndex: 0,
          onTabChanged: (_) {},
          tabs: <AppNavigationTab>[
            AppNavigationTab(
              label: 'Home',
              icon: IconName.home,
              onRefresh: () async => home++,
              body: const Center(child: Text('Home body')),
            ),
            AppNavigationTab(
              label: 'Browse',
              icon: IconName.library,
              onRefresh: () async => browse++,
              body: const Center(child: Text('Browse body')),
            ),
          ],
        );

        await tester.fling(
          find.text('Home body'),
          const Offset(0, 300),
          1000,
        );
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));

        expect(home, 1);
        expect(browse, 0);
        debugDefaultTargetPlatformOverride = null;
      });
    });
  });
}

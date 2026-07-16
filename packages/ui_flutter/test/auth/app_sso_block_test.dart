import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const _allProviders = <SsoProvider>[
  SsoProvider(
    id: 'google',
    label: 'Continue with Google',
    iconName: IconName.mail,
  ),
  SsoProvider(
    id: 'github',
    label: 'Continue with GitHub',
    iconName: IconName.github,
  ),
  SsoProvider(id: 'sso', label: 'Single sign-on', iconName: IconName.key),
];

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

/// The labelled-group [Semantics] nodes under [AppSsoBlock] — see its class
/// doc "Web parity" for why this is a plain labelled container rather than a
/// [SemanticsRole], which has no ARIA-`group`-equivalent constant.
Iterable<Semantics> _groupSemantics(WidgetTester tester) => tester
    .widgetList<Semantics>(
      find.descendant(
        of: find.byType(AppSsoBlock),
        matching: find.byType(Semantics),
      ),
    )
    .where((s) => s.properties.label == 'Sign in with');

void main() {
  group('AppSsoBlock', () {
    testWidgets('renders nothing when providers is empty', (tester) async {
      await _pump(tester, const AppSsoBlock(providers: <SsoProvider>[]));

      expect(find.byType(AppButton), findsNothing);
      expect(_groupSemantics(tester), isEmpty);
    });

    testWidgets('renders one button per provider', (tester) async {
      await _pump(tester, const AppSsoBlock(providers: _allProviders));

      expect(find.byType(AppButton), findsNWidgets(3));
    });

    testWidgets('shows the provider label inside each button', (tester) async {
      await _pump(tester, const AppSsoBlock(providers: _allProviders));

      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Continue with GitHub'), findsOneWidget);
      expect(find.text('Single sign-on'), findsOneWidget);
    });

    testWidgets('renders the provider glyph leading each button', (
      tester,
    ) async {
      await _pump(tester, const AppSsoBlock(providers: _allProviders));

      final buttons = tester
          .widgetList<AppButton>(find.byType(AppButton))
          .toList();
      expect(buttons.map((b) => b.iconLeading), <IconName>[
        IconName.mail,
        IconName.github,
        IconName.key,
      ]);
    });

    testWidgets('every button is secondary and block', (tester) async {
      await _pump(tester, const AppSsoBlock(providers: _allProviders));

      final buttons = tester
          .widgetList<AppButton>(find.byType(AppButton))
          .toList();
      expect(
        buttons.every((b) => b.variant == AppButtonVariant.secondary),
        isTrue,
      );
      expect(buttons.every((b) => b.block), isTrue);
    });

    testWidgets(
      'exposes a labelled group container with "Sign in with" as its accessible name',
      (tester) async {
        await _pump(tester, const AppSsoBlock(providers: _allProviders));

        final labelled = _groupSemantics(tester);
        expect(labelled, hasLength(1));
        expect(labelled.first.container, isTrue);
      },
    );

    testWidgets('emits onSelect with the provider id when a button is tapped', (
      tester,
    ) async {
      final seen = <String>[];
      await _pump(
        tester,
        AppSsoBlock(providers: _allProviders, onSelect: seen.add),
      );

      await tester.tap(find.text('Continue with Google'));
      await tester.tap(find.text('Single sign-on'));

      expect(seen, <String>['google', 'sso']);
    });

    testWidgets('handles a single-provider list', (tester) async {
      await _pump(
        tester,
        AppSsoBlock(providers: <SsoProvider>[_allProviders[1]]),
      );

      expect(find.byType(AppButton), findsOneWidget);
      expect(find.text('Continue with GitHub'), findsOneWidget);
    });

    testWidgets('with no onSelect the buttons are non-interactive', (
      tester,
    ) async {
      await _pump(tester, const AppSsoBlock(providers: _allProviders));

      final buttons = tester
          .widgetList<AppButton>(find.byType(AppButton))
          .toList();
      expect(buttons.every((b) => b.onPressed == null), isTrue);
    });
  });
}

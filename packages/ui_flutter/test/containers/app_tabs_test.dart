import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const _items = <AppTabItem>[
  AppTabItem(label: 'Overview'),
  AppTabItem(label: 'Curriculum'),
  AppTabItem(label: 'Reviews'),
];

Future<void> _pump(
  WidgetTester tester, {
  required int selectedIndex,
  required ValueChanged<int> onChanged,
  List<AppTabItem> items = _items,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: Center(
          child: AppTabs(
            items: items,
            selectedIndex: selectedIndex,
            onChanged: onChanged,
            label: 'Course sections',
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('AppTabs', () {
    testWidgets('renders every item label', (tester) async {
      await _pump(tester, selectedIndex: 0, onChanged: (_) {});
      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('Curriculum'), findsOneWidget);
      expect(find.text('Reviews'), findsOneWidget);
    });

    testWidgets('fires onChanged with the tapped index', (tester) async {
      int? selected;
      await _pump(
        tester,
        selectedIndex: 0,
        onChanged: (index) => selected = index,
      );
      await tester.tap(find.text('Reviews'));
      expect(selected, 2);
    });

    testWidgets(
      'highlights the selected index (loud text + accent underline)',
      (tester) async {
        await _pump(tester, selectedIndex: 1, onChanged: (_) {});
        final theme = AppTheme.light();
        final sem = theme.extension<AppSemanticColors>()!;

        final selectedText = tester.widget<Text>(find.text('Curriculum'));
        expect(selectedText.style!.color, sem.textLoud);

        final unselectedText = tester.widget<Text>(find.text('Overview'));
        expect(unselectedText.style!.color, theme.colorScheme.onSurfaceVariant);
      },
    );

    testWidgets('exposes selected state via Semantics', (tester) async {
      await _pump(tester, selectedIndex: 1, onChanged: (_) {});
      final selected = tester.getSemantics(find.text('Curriculum'));
      expect(selected.flagsCollection.isSelected, Tristate.isTrue);
      final unselected = tester.getSemantics(find.text('Overview'));
      expect(unselected.flagsCollection.isSelected, isNot(Tristate.isTrue));
    });

    testWidgets('renders an IconCS glyph when an item declares one', (
      tester,
    ) async {
      await _pump(
        tester,
        selectedIndex: 0,
        onChanged: (_) {},
        items: const <AppTabItem>[
          AppTabItem(label: 'Overview', icon: IconName.play),
          AppTabItem(label: 'Reviews'),
        ],
      );
      expect(find.byType(IconCS), findsOneWidget);
    });
  });
}

import 'dart:ui' show CheckedState;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const _items = <AppSegmentedItemData>[
  AppSegmentedItemData(label: 'List'),
  AppSegmentedItemData(label: 'Grid'),
  AppSegmentedItemData(label: 'Compact'),
];

Future<void> _pump(
  WidgetTester tester, {
  required int selectedIndex,
  required ValueChanged<int> onChanged,
  List<AppSegmentedItemData> items = _items,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: Center(
          child: AppSegmented(
            items: items,
            selectedIndex: selectedIndex,
            onChanged: onChanged,
            label: 'View mode',
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('AppSegmented', () {
    testWidgets('renders every item label', (tester) async {
      await _pump(tester, selectedIndex: 0, onChanged: (_) {});
      expect(find.text('List'), findsOneWidget);
      expect(find.text('Grid'), findsOneWidget);
      expect(find.text('Compact'), findsOneWidget);
    });

    testWidgets('fires onChanged with the tapped index', (tester) async {
      int? selected;
      await _pump(
        tester,
        selectedIndex: 0,
        onChanged: (index) => selected = index,
      );
      await tester.tap(find.text('Grid'));
      expect(selected, 1);
    });

    testWidgets('highlights the selected index (loud text + surface fill)', (
      tester,
    ) async {
      await _pump(tester, selectedIndex: 2, onChanged: (_) {});
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;

      final selectedText = tester.widget<Text>(find.text('Compact'));
      expect(selectedText.style!.color, sem.textLoud);

      final unselectedText = tester.widget<Text>(find.text('List'));
      expect(unselectedText.style!.color, theme.colorScheme.onSurfaceVariant);
    });

    testWidgets('exposes checked state via Semantics (radio parity)', (
      tester,
    ) async {
      await _pump(tester, selectedIndex: 1, onChanged: (_) {});
      final selected = tester.getSemantics(find.text('Grid'));
      expect(selected.flagsCollection.isChecked, CheckedState.isTrue);
      final unselected = tester.getSemantics(find.text('List'));
      expect(unselected.flagsCollection.isChecked, isNot(CheckedState.isTrue));
    });

    testWidgets('renders an IconCS glyph when an item declares one', (
      tester,
    ) async {
      await _pump(
        tester,
        selectedIndex: 0,
        onChanged: (_) {},
        items: const <AppSegmentedItemData>[
          AppSegmentedItemData(label: 'List', icon: IconName.play),
          AppSegmentedItemData(label: 'Grid'),
        ],
      );
      expect(find.byType(IconCS), findsOneWidget);
    });
  });
}

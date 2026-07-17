import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

void main() {
  group('IconName enum + glyph table', () {
    test('has exactly 71 named glyphs', () {
      expect(IconName.values.length, 71);
    });

    test('every IconName resolves to inner SVG markup', () {
      for (final name in IconName.values) {
        expect(
          kIconMarkup.containsKey(name),
          isTrue,
          reason: 'missing glyph markup for $name',
        );
        expect(kIconMarkup[name], isNotEmpty);
      }
    });

    test('camelCase names map to the web kebab-case tokens', () {
      expect(IconName.play.token, 'play');
      expect(IconName.checkCircle.token, 'check-circle');
      expect(IconName.cloudDown.token, 'cloud-down');
      expect(IconName.volumeMute.token, 'volume-mute');
      expect(IconName.moreH.token, 'more-h');
      expect(IconName.cornerDownRight.token, 'corner-down-right');
      expect(IconName.hardDrive.token, 'hard-drive');
      expect(IconName.homeFill.token, 'home-fill');
      expect(IconName.settingsFill.token, 'settings-fill');
    });

    test('every nav glyph has a filled counterpart', () {
      expect(kNavFilledIcons, {
        IconName.home: IconName.homeFill,
        IconName.library: IconName.libraryFill,
        IconName.download: IconName.downloadFill,
        IconName.search: IconName.searchFill,
        IconName.settings: IconName.settingsFill,
      });
    });

    test('the filled nav glyphs opt out of the envelope stroke', () {
      // The shared envelope sets stroke-width 1.5 on the root; a silhouette
      // that forgets stroke="none" is painted 0.75 units fatter than drawn.
      for (final name in kNavFilledIcons.values) {
        final markup = kIconMarkup[name]!;
        final elements = RegExp('<(path|rect|circle)').allMatches(markup).length;
        expect(
          'stroke="none"'.allMatches(markup).length,
          elements,
          reason: '$name has an element that the envelope would stroke',
        );
        expect(markup, contains('fill="currentColor"'));
      }
    });
  });

  group('buildIconSvg', () {
    test('produces a valid <svg> envelope with the 24x24 viewBox', () {
      final svg = buildIconSvg(IconName.play);
      expect(svg, startsWith('<svg'));
      expect(svg, contains('viewBox="0 0 24 24"'));
      expect(svg, contains('stroke="currentColor"'));
      expect(svg, endsWith('</svg>'));
    });

    test('fill toggles geometry on the fillable glyphs (play, bookmark)', () {
      for (final name in kFillableIcons) {
        expect(buildIconSvg(name, fill: true), contains('fill="currentColor"'));
        expect(buildIconSvg(name, fill: false), contains('fill="none"'));
      }
      expect(kFillableIcons, {IconName.play, IconName.bookmark});
    });

    test(
      'leaves no unsubstituted fill sentinel for any glyph or fill state',
      () {
        for (final name in IconName.values) {
          expect(buildIconSvg(name, fill: true), isNot(contains('__FILL__')));
          expect(buildIconSvg(name, fill: false), isNot(contains('__FILL__')));
        }
      },
    );
  });

  group('IconCS widget', () {
    testWidgets('renders one SvgPicture at the default size', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: IconCS(name: IconName.play)),
      );
      final picture = tester.widget<SvgPicture>(find.byType(SvgPicture));
      expect(picture.width, 20);
      expect(picture.height, 20);
    });

    testWidgets('honours the size override', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: IconCS(name: IconName.play, size: 16)),
      );
      final picture = tester.widget<SvgPicture>(find.byType(SvgPicture));
      expect(picture.width, 16);
    });

    testWidgets('applies a colour filter (currentColor equivalent)', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: IconCS(name: IconName.play, color: Color(0xFFFF0000)),
        ),
      );
      final picture = tester.widget<SvgPicture>(find.byType(SvgPicture));
      expect(
        picture.colorFilter,
        const ColorFilter.mode(Color(0xFFFF0000), BlendMode.srcIn),
      );
    });

    testWidgets('is decorative by default (no semantic label)', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        const MaterialApp(home: IconCS(name: IconName.play)),
      );
      expect(find.bySemanticsLabel('Play video'), findsNothing);
      handle.dispose();
    });

    testWidgets('exposes a semantic label when given one', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        const MaterialApp(
          home: IconCS(name: IconName.play, semanticLabel: 'Play video'),
        ),
      );
      expect(find.bySemanticsLabel('Play video'), findsOneWidget);
      handle.dispose();
    });
  });
}

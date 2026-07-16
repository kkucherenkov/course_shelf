import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/sample_image.dart';

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppAvatar', () {
    testWidgets(
      'renders an Image with the provided provider when `image` is set',
      (tester) async {
        final provider = sampleAvatarImage();
        await _pump(tester, AppAvatar(image: provider, name: 'John Doe'));

        final image = tester.widget<Image>(find.byType(Image));
        expect(image.image, provider);
        expect(
          find.bySemanticsLabel('John Doe'),
          findsOneWidget,
          reason: 'name is used as the image semantic label, mirroring web alt',
        );
      },
    );

    testWidgets(
      'uses "Avatar" as the semantic label when image is set but name is absent',
      (tester) async {
        await _pump(tester, AppAvatar(image: sampleAvatarImage()));
        expect(find.bySemanticsLabel('Avatar'), findsOneWidget);
      },
    );

    testWidgets('does not render an Image when no image is set', (
      tester,
    ) async {
      await _pump(tester, const AppAvatar(name: 'Jane Smith'));
      expect(find.byType(Image), findsNothing);
    });

    testWidgets('derives initials from name — two words', (tester) async {
      await _pump(tester, const AppAvatar(name: 'John Doe'));
      expect(find.text('JD'), findsOneWidget);
    });

    testWidgets('derives initials from name — single word', (tester) async {
      await _pump(tester, const AppAvatar(name: 'Admin'));
      expect(find.text('A'), findsOneWidget);
    });

    testWidgets(
      'derives initials from name — more than two words uses first two',
      (tester) async {
        await _pump(tester, const AppAvatar(name: 'Mary Jane Watson'));
        expect(find.text('MJ'), findsOneWidget);
      },
    );

    testWidgets('uses explicit initials (uppercased) over derived initials', (
      tester,
    ) async {
      await _pump(tester, const AppAvatar(name: 'John Doe', initials: 'zz'));
      expect(find.text('ZZ'), findsOneWidget);
      expect(find.text('JD'), findsNothing);
    });

    testWidgets(
      'renders empty string as initials when neither name nor initials are set',
      (tester) async {
        await _pump(tester, const AppAvatar());
        expect(find.text(''), findsOneWidget);
      },
    );

    testWidgets('each size resolves its token diameter', (tester) async {
      final diameters = <AppAvatarSize, double>{
        AppAvatarSize.xs: 20,
        AppAvatarSize.sm: 24,
        AppAvatarSize.md: 32,
        AppAvatarSize.lg: 40,
        AppAvatarSize.xl: 56,
      };
      for (final entry in diameters.entries) {
        await _pump(tester, AppAvatar(name: 'X', size: entry.key));
        final size = tester.getSize(find.byType(AppAvatar));
        expect(size.width, entry.value, reason: 'size ${entry.key.name} width');
        expect(
          size.height,
          entry.value,
          reason: 'size ${entry.key.name} height',
        );
      }
    });

    testWidgets('defaults to size=md', (tester) async {
      await _pump(tester, const AppAvatar(name: 'X'));
      expect(tester.getSize(find.byType(AppAvatar)), const Size(32, 32));
    });

    testWidgets('does not render a role badge when role is absent', (
      tester,
    ) async {
      await _pump(tester, const AppAvatar(name: 'John'));
      expect(find.bySemanticsLabel('Administrator'), findsNothing);
      expect(find.bySemanticsLabel('Guest'), findsNothing);
    });

    testWidgets('renders admin role badge labelled "Administrator"', (
      tester,
    ) async {
      // `name` deliberately does not derive to "A" (the badge letter) so the
      // two "A" texts (initials vs. badge glyph) can't be confused.
      await _pump(
        tester,
        const AppAvatar(name: 'Ann Lee', role: AppAvatarRole.admin),
      );
      expect(
        find.text('AL'),
        findsOneWidget,
        reason: 'initials, unaffected by the badge',
      );
      expect(find.text('A'), findsOneWidget, reason: 'the badge glyph');
      expect(find.bySemanticsLabel('Administrator'), findsOneWidget);
    });

    testWidgets('renders guest role badge labelled "Guest"', (tester) async {
      await _pump(
        tester,
        const AppAvatar(name: 'Guest User', role: AppAvatarRole.guest),
      );
      expect(find.text('G'), findsOneWidget);
      expect(find.bySemanticsLabel('Guest'), findsOneWidget);
    });

    testWidgets('role badge does not change the avatar bounding size', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppAvatar(
          name: 'Admin',
          size: AppAvatarSize.lg,
          role: AppAvatarRole.admin,
        ),
      );
      expect(tester.getSize(find.byType(AppAvatar)), const Size(40, 40));
    });
  });
}

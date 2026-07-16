import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';
import '../_support/sample_image.dart';

Widget _row(List<Widget> children) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 6),
  child: Row(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.center,
    children: <Widget>[
      for (final child in children)
        Padding(padding: const EdgeInsets.only(right: 16), child: child),
    ],
  ),
);

Widget _matrix(ThemeData theme) {
  final image = sampleAvatarImage();
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Padding(
              padding: EdgeInsets.only(bottom: 2),
              child: Text('sizes — initials'),
            ),
            _row(<Widget>[
              for (final size in AppAvatarSize.values)
                AppAvatar(name: 'John Doe', size: size),
            ]),
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 2),
              child: Text('sizes — image'),
            ),
            _row(<Widget>[
              for (final size in AppAvatarSize.values)
                AppAvatar(image: image, name: 'John Doe', size: size),
            ]),
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 2),
              child: Text('role badges'),
            ),
            _row(<Widget>[
              const AppAvatar(
                name: 'Ann Lee',
                size: AppAvatarSize.lg,
                role: AppAvatarRole.admin,
              ),
              const AppAvatar(
                name: 'Guest User',
                size: AppAvatarSize.lg,
                role: AppAvatarRole.guest,
              ),
              AppAvatar(
                image: image,
                name: 'Ann Lee',
                size: AppAvatarSize.lg,
                role: AppAvatarRole.admin,
              ),
              AppAvatar(
                image: image,
                name: 'Guest User',
                size: AppAvatarSize.lg,
                role: AppAvatarRole.guest,
              ),
              const AppAvatar(name: 'No Role', size: AppAvatarSize.lg),
            ]),
          ],
        ),
      ),
    ),
  );
}

Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('avatar matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(760, 360),
    );
    await screenMatchesGolden(
      tester,
      'avatar_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('avatar matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(760, 360),
    );
    await screenMatchesGolden(
      tester,
      'avatar_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}

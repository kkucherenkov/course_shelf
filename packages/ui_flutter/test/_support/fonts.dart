import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

/// Registers this package's bundled TTFs under the `packages/app_ui/`-prefixed
/// family names that [AppTheme] uses.
///
/// Fonts declared by a package resolve as `packages/<name>/<family>` only for
/// CONSUMERS of that package. Inside `app_ui`'s own test binary `app_ui` is the
/// ROOT package, so Flutter registers the BARE family names — and the prefixed
/// names the theme uses fall back to Ahem with no error and no test failure.
/// `fontFamilyFallback` does NOT rescue this; only re-registration does.
///
/// Call from `setUpAll` in any test that renders themed text or a golden.
Future<void> loadPackagedFonts() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  await _register('packages/app_ui/${AppFontFamily.sans}', <String>[
    'fonts/IBMPlexSans-Regular.ttf',
    'fonts/IBMPlexSans-Medium.ttf',
    'fonts/IBMPlexSans-SemiBold.ttf',
    'fonts/IBMPlexSans-Bold.ttf',
  ]);
  await _register('packages/app_ui/${AppFontFamily.mono}', <String>[
    'fonts/IBMPlexMono-Regular.ttf',
  ]);
}

Future<void> _register(String family, List<String> assetPaths) async {
  final loader = FontLoader(family);
  for (final path in assetPaths) {
    final bytes = await File(path).readAsBytes();
    loader.addFont(Future<ByteData>.value(ByteData.sublistView(bytes)));
  }
  await loader.load();
}

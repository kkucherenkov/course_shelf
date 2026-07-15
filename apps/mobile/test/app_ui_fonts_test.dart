import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

/// Guards `packages/ui_flutter/pubspec.yaml`'s `fonts:` declaration.
///
/// Unlike `packages/ui_flutter/test/_support/fonts.dart`, this test never
/// touches the filesystem. It loads faces from the REAL asset bundle that
/// `flutter test` builds from `app_ui`'s pubspec — the same bundle
/// `apps/mobile` ships in production, where `app_ui` is a path dependency
/// and its fonts resolve under the `packages/app_ui/`-prefixed family
/// names. If a TTF is renamed, a weight dropped, or an `asset:` path
/// mistyped, `FontManifest.json` loses that entry and the family silently
/// falls back to the Ahem test font (or the platform default outside
/// tests) — this test catches that by asserting laid-out text width is not
/// the Ahem monospace width.
Future<void> _loadFontsFromRealAssetBundle() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final manifestJson = await rootBundle.loadString('FontManifest.json');
  final manifest = jsonDecode(manifestJson) as List<dynamic>;

  for (final entry in manifest) {
    final map = entry as Map<String, dynamic>;
    final family = map['family'] as String;
    final fonts = map['fonts'] as List<dynamic>;

    final loader = FontLoader(family);
    for (final font in fonts) {
      final asset = (font as Map<String, dynamic>)['asset'] as String;
      loader.addFont(
        rootBundle.load(asset).then((ByteData data) => data),
      );
    }
    await loader.load();
  }
}

/// Lays out [text] at [fontSize] under [family] and returns the rendered
/// width. Ahem (the test font Flutter substitutes for unresolved families)
/// renders every glyph as a square equal to the font size, so 8 characters
/// at 40px resolves to exactly 320.0 when the family did not resolve.
double _widthOf(String family, {String text = 'MMMMiiii', double fontSize = 40}) {
  final painter = TextPainter(
    text: TextSpan(
      text: text,
      style: TextStyle(fontFamily: family, fontSize: fontSize),
    ),
    textDirection: TextDirection.ltr,
  )..layout();
  return painter.width;
}

void main() {
  setUpAll(_loadFontsFromRealAssetBundle);

  test('app_ui packaged fonts resolve from the real asset bundle', () {
    final sansWidth = _widthOf('packages/app_ui/${AppFontFamily.sans}');
    final monoWidth = _widthOf('packages/app_ui/${AppFontFamily.mono}');

    // 320.0 == 8 chars * 40px == the Ahem fallback width, i.e. unresolved.
    expect(sansWidth, isNot(320.0));
    expect(monoWidth, isNot(320.0));
  });
}

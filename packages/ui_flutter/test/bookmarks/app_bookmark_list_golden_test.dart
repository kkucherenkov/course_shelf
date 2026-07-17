import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const List<BookmarkEntry> _sample = <BookmarkEntry>[
  BookmarkEntry(id: 'a', time: 42, label: 'Definition of consensus'),
  BookmarkEntry(id: 'b', time: 305, label: 'Quorum reads worked example'),
  BookmarkEntry(id: 'c', time: 930),
];

Widget _section(String label, Widget child) => Padding(
  padding: const EdgeInsets.only(bottom: 16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[Text(label), const SizedBox(height: 4), child],
  ),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: 360,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                _section('default', const AppBookmarkList(bookmarks: _sample)),
                _section(
                  'read-only',
                  const AppBookmarkList(bookmarks: _sample, editable: false),
                ),
                _section(
                  'with add row',
                  const AppBookmarkList(bookmarks: _sample, addTime: 1024),
                ),
                _section(
                  'adding',
                  const AppBookmarkList(
                    bookmarks: _sample,
                    addTime: 1024,
                    adding: true,
                  ),
                ),
                _section(
                  'empty',
                  const AppBookmarkList(bookmarks: <BookmarkEntry>[]),
                ),
                _section(
                  'empty with add row',
                  const AppBookmarkList(
                    bookmarks: <BookmarkEntry>[],
                    addTime: 90,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

// The "adding" section renders AppButton's spinner, which animates
// indefinitely — the default `pumpAndSettle` never settles, so drive a single
// fixed-duration frame instead (mirrors the AppBookmarkAdd matrix golden).
Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppBookmarkList matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 1260),
    );
    await screenMatchesGolden(
      tester,
      'app_bookmark_list_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('AppBookmarkList matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 1260),
    );
    await screenMatchesGolden(
      tester,
      'app_bookmark_list_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}

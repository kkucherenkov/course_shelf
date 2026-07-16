import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const String _sampleMd = '''
# Quorum reads

With **N=5, R=3, W=3** we satisfy R+W>N so reads see the latest write.

Caveats:
- Linearizable only with a leader.
- Otherwise *stale-within-session* is still possible.''';

Widget _row(String label, Widget child) => Padding(
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
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: 480,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _row(
                'edit — saved',
                AppNoteEditor(
                  modelValue: _sampleMd,
                  savedAt: DateTime.now().subtract(const Duration(seconds: 4)),
                ),
              ),
              _row(
                'preview',
                const AppNoteEditor(
                  modelValue: _sampleMd,
                  mode: AppNoteMode.view,
                ),
              ),
              _row(
                'syncing',
                const AppNoteEditor(
                  modelValue: _sampleMd,
                  syncState: AppNoteSyncState.syncing,
                ),
              ),
              _row(
                'failed',
                const AppNoteEditor(
                  modelValue: _sampleMd,
                  syncState: AppNoteSyncState.failed,
                ),
              ),
              _row(
                'offline',
                const AppNoteEditor(
                  modelValue: _sampleMd,
                  syncState: AppNoteSyncState.offline,
                ),
              ),
              _row('empty', const AppNoteEditor(modelValue: '')),
            ],
          ),
        ),
      ),
    ),
  );
}

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppNoteEditor matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(520, 2200),
    );
    await screenMatchesGolden(tester, 'app_note_editor_matrix_light');
  });

  testGoldens('AppNoteEditor matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(520, 2200),
    );
    await screenMatchesGolden(tester, 'app_note_editor_matrix_dark');
  });
}

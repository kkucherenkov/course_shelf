import 'dart:io';

import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';

import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// `AppDatabase.open()` (resolved transitively through `DownloadsRepository`)
/// opens a real `drift_flutter` connection, which asks `path_provider` for a
/// documents + temp directory the instant the lazy singleton is built — no
/// query has to run first. Every other Drift test in this suite sidesteps
/// that by constructing `AppDatabase(NativeDatabase.memory())` directly; this
/// is the first test to go through the real composition root, so it needs the
/// platform channel this suite otherwise never touches.
class _FakePathProviderPlatform extends PathProviderPlatform {
  _FakePathProviderPlatform(this._path);

  final String _path;

  @override
  Future<String?> getApplicationDocumentsPath() async => _path;

  @override
  Future<String?> getApplicationSupportPath() async => _path;

  @override
  Future<String?> getTemporaryPath() async => _path;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Each test below builds its own real AppDatabase (a fresh temp directory
  // each time), which is exactly two distinct on-disk files, never the same
  // QueryExecutor — drift's "opened twice" warning only tracks how many times
  // the *type* has been constructed in this process, not whether the files
  // collide, so it does not apply here.
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late Directory tempDir;

  setUp(() {
    tempDir = Directory.systemTemp.createTempSync('downloads_wiring_test_');
    PathProviderPlatform.instance = _FakePathProviderPlatform(tempDir.path);
    configureDependencies();
  });

  tearDown(() async {
    await resetInjector();
    if (tempDir.existsSync()) tempDir.deleteSync(recursive: true);
  });

  test('the downloads ports resolve as singletons', () {
    expect(getIt<DownloadsRepository>(), same(getIt<DownloadsRepository>()));
    expect(getIt<DownloadKeyStore>(), same(getIt<DownloadKeyStore>()));
    expect(
      getIt<DownloadSchedulerPort>(),
      same(getIt<DownloadSchedulerPort>()),
    );
  });

  test('DownloadsBloc is a factory — each provider gets its own', () {
    expect(getIt<DownloadsBloc>(), isNot(same(getIt<DownloadsBloc>())));
  });
}

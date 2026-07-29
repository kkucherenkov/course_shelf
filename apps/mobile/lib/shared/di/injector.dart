import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

import 'package:app_mobile/features/auth/data/auth_api.dart';
import 'package:app_mobile/features/auth/data/instance_api.dart';
import 'package:app_mobile/features/auth/data/library_api.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/browse/data/browse_repository_impl.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/course_detail/data/course_detail_repository_impl.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_cubit.dart';
import 'package:app_mobile/features/downloads/data/downloads_repository_impl.dart';
import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/data/platform_download_scheduler.dart';
import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/home/data/home_repository_impl.dart';
import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/features/player/data/progress_outbox_recorder.dart';
import 'package:app_mobile/features/player/data/video_player_adapter.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/search/data/search_repository_impl.dart';
import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/shared/auth/token_storage.dart';
import 'package:app_mobile/shared/config/app_config.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';
import 'package:app_mobile/shared/network/api_client.dart';
import 'package:app_mobile/shared/preferences/playback_preferences.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

/// Global service locator. All runtime dependencies register here; widgets
/// resolve blocs via `BlocProvider(create: (_) => getIt<FooBloc>())` and
/// MUST NOT call `getIt<T>()` inside `build()`.
final GetIt getIt = GetIt.instance;

/// Wires the composition root. Call once, before `runApp`.
///
/// Ports (interfaces) are registered as lazy singletons — features consume the
/// interface, not the implementation. Blocs/Cubits are factories — each
/// `BlocProvider` gets a fresh instance.
void configureDependencies() {
  if (getIt.isRegistered<AppConfig>()) {
    return;
  }

  // ── Infra singletons ────────────────────────────────────────────────────
  getIt
    ..registerLazySingleton<AppConfig>(AppConfig.fromEnv)
    ..registerLazySingleton<TokenStorage>(SecureTokenStorage.new)
    ..registerLazySingleton<Dio>(
      () => buildDio(
        config: getIt<AppConfig>(),
        tokenStorage: getIt<TokenStorage>(),
      ),
    )
    ..registerLazySingleton<AppDatabase>(AppDatabase.open);

  // ── Domain repository singletons ────────────────────────────────────────
  getIt
    ..registerLazySingleton<AuthRepository>(
      () => AuthApiImpl(dio: getIt<Dio>(), tokenStorage: getIt<TokenStorage>()),
    )
    ..registerLazySingleton<InstanceRepository>(
      () => InstanceApiImpl(dio: getIt<Dio>()),
    )
    ..registerLazySingleton<LibraryRepository>(
      () => LibraryApiImpl(dio: getIt<Dio>()),
    )
    ..registerLazySingleton<HomeRepository>(
      () => HomeRepositoryImpl(getIt<Dio>()),
    )
    ..registerLazySingleton<BrowseRepository>(
      () => BrowseRepositoryImpl(getIt<Dio>()),
    )
    ..registerLazySingleton<CourseDetailRepository>(
      () => CourseDetailRepositoryImpl(getIt<Dio>()),
    )
    ..registerLazySingleton<SearchRepository>(
      () => SearchRepositoryImpl(getIt<Dio>()),
    )
    ..registerLazySingleton<LessonPlayerRepository>(
      () => LessonPlayerApi(
        dio: getIt<Dio>(),
        downloadsDao: DownloadsDao(getIt<AppDatabase>()),
      ),
    )
    ..registerLazySingleton<LessonProgressRecorder>(
      () => ProgressOutboxRecorder(ProgressOutboxDao(getIt<AppDatabase>())),
    )
    // Zero-argument constructor deliberately, not `SecureDownloadKeyStore()`
    // with an explicit `FlutterSecureStorage` — the zero-arg form is what
    // supplies `IOSOptions(accessibility: KeychainAccessibility.first_unlock)`.
    // Passing a storage instance in would silently drop that option and make
    // the download key unreadable to a background task on a locked device.
    ..registerLazySingleton<DownloadKeyStore>(SecureDownloadKeyStore.new)
    ..registerLazySingleton<LessonByteSource>(
      () => HttpLessonByteSource(dio: getIt<Dio>()),
    )
    ..registerLazySingleton<DownloadSchedulerPort>(
      () => PlatformDownloadScheduler(
        // Registered as a one-off rather than periodic: the task's only job is
        // to resume, and WorkManager's minimum periodic interval (15 min) is
        // coarser than a download that may finish in seconds.
        register: () => Workmanager().registerOneOffTask(
          kDownloadResumeTask,
          kDownloadResumeTask,
          existingWorkPolicy: ExistingWorkPolicy.keep,
          constraints: Constraints(networkType: NetworkType.connected),
        ),
        cancel: () => Workmanager().cancelByUniqueName(kDownloadResumeTask),
      ),
    )
    ..registerLazySingleton<DownloadsRepository>(
      () => DownloadsRepositoryImpl(
        dao: DownloadsDao(getIt<AppDatabase>()),
        byteSource: getIt<LessonByteSource>(),
        keyStore: getIt<DownloadKeyStore>(),
        scheduler: getIt<DownloadSchedulerPort>(),
        downloadsDirectory: () async {
          final Directory base = await getApplicationSupportDirectory();
          return Directory('${base.path}/downloads');
        },
        // `checkConnectivity` returns the interfaces currently available; an
        // empty list or `none` means offline. This only gates *starting* work —
        // a connection that dies mid-transfer surfaces as a socket error and
        // goes through the normal backoff.
        isOnline: () async {
          final List<ConnectivityResult> result = await Connectivity()
              .checkConnectivity();
          return result.any(
            (ConnectivityResult r) => r != ConnectivityResult.none,
          );
        },
      ),
    )
    ..registerLazySingleton<LoopbackDecryptServer>(
      () => LoopbackDecryptServer(
        resolveFile: (String lessonId) async {
          final DownloadedLesson? row = await DownloadsDao(
            getIt<AppDatabase>(),
          ).byLessonId(lessonId);
          if (row == null || row.state != DownloadState.ready) return null;
          return File(row.filePath);
        },
        key: () => getIt<DownloadKeyStore>().keyForDevice(),
      ),
    );

  // ── Cubit / Bloc factories ──────────────────────────────────────────────
  //
  // AuthCubit is the session cubit. SignInCubit / SignUpCubit / ForgotCubit
  // each need the *ambient* AuthCubit — the one `App` provides above the
  // Navigator — and get_it cannot hand that out: AuthCubit is a factory, so
  // `getIt` would mint a second session for them to authenticate while
  // AuthGate watches the first. They are constructed in their screens'
  // BlocProviders from `context.read<AuthCubit>()` plus the ports above.
  getIt
    ..registerFactory<AuthCubit>(() => AuthCubit(getIt<AuthRepository>()))
    ..registerFactory<HomeCubit>(() => HomeCubit(getIt<HomeRepository>()))
    ..registerFactory<BrowseCubit>(() => BrowseCubit(getIt<BrowseRepository>()))
    ..registerFactory<CourseDetailCubit>(
      () => CourseDetailCubit(getIt<CourseDetailRepository>()),
    )
    ..registerFactory<SearchCubit>(
      () =>
          SearchCubit(getIt<SearchRepository>(), getIt<RecentSearchesStore>()),
    )
    ..registerFactory<SettingsCubit>(
      () => SettingsCubit(getIt<SettingsPreferencesStore>()),
    )
    // A factory, and a fresh VideoPlayerAdapter per instance: the adapter owns
    // a platform controller that PlayerBloc.close() disposes, so a shared
    // singleton would hand the next lesson a disposed engine.
    ..registerFactory<PlayerBloc>(
      () => PlayerBloc(
        repository: getIt<LessonPlayerRepository>(),
        progressRecorder: getIt<LessonProgressRecorder>(),
        playback: VideoPlayerAdapter(),
        playbackPreferences: getIt<PlaybackPreferences>(),
      ),
    )
    ..registerFactory<DownloadsBloc>(
      () => DownloadsBloc(getIt<DownloadsRepository>()),
    );
}

/// Registers `shared_preferences` and its stores. Async because
/// `SharedPreferences.getInstance()` is — call with `await` after
/// [configureDependencies] and before `runApp`.
Future<void> bootstrapPreferences() async {
  if (getIt.isRegistered<SharedPreferences>()) return;
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  getIt
    ..registerSingleton<SharedPreferences>(prefs)
    ..registerLazySingleton<SettingsPreferencesStore>(
      () => SettingsPreferencesStore(getIt<SharedPreferences>()),
    )
    ..registerLazySingleton<PlaybackPreferences>(
      () => getIt<SettingsPreferencesStore>(),
    )
    ..registerLazySingleton<RecentSearchesStore>(
      () => RecentSearchesStore(getIt<SharedPreferences>()),
    );
}

/// Test-only reset hook. Call in `tearDown` to drop singletons between cases.
Future<void> resetInjector() => getIt.reset();

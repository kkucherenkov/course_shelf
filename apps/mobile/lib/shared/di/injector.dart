import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';

import 'package:app_mobile/features/auth/data/auth_api.dart';
import 'package:app_mobile/features/auth/data/instance_api.dart';
import 'package:app_mobile/features/auth/data/library_api.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/features/player/data/progress_outbox_recorder.dart';
import 'package:app_mobile/features/player/data/video_player_adapter.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/shared/auth/token_storage.dart';
import 'package:app_mobile/shared/config/app_config.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/network/api_client.dart';

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
    ..registerLazySingleton<LessonPlayerRepository>(
      () => LessonPlayerApi(
        dio: getIt<Dio>(),
        downloadsDao: DownloadsDao(getIt<AppDatabase>()),
      ),
    )
    ..registerLazySingleton<LessonProgressRecorder>(
      () => ProgressOutboxRecorder(ProgressOutboxDao(getIt<AppDatabase>())),
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
    // A factory, and a fresh VideoPlayerAdapter per instance: the adapter owns
    // a platform controller that PlayerBloc.close() disposes, so a shared
    // singleton would hand the next lesson a disposed engine.
    ..registerFactory<PlayerBloc>(
      () => PlayerBloc(
        repository: getIt<LessonPlayerRepository>(),
        progressRecorder: getIt<LessonProgressRecorder>(),
        playback: VideoPlayerAdapter(),
      ),
    );
}

/// Test-only reset hook. Call in `tearDown` to drop singletons between cases.
Future<void> resetInjector() => getIt.reset();

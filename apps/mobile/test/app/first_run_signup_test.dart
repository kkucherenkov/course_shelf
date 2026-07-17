import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/main_shell.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// Headless twin of `integration_test/auth_flow_test.dart`'s first-user case.
///
/// The integration_test version needs a device this CI lane has none of, so
/// this pumps the same real `App` as a widget test to actually *run* the
/// AuthGate first-run routing → the 3-step wizard → session adoption → shell.
class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

class _MockLibraryRepository extends Mock implements LibraryRepository {}

/// The wizard's final step adopts the session and mounts the shell, which
/// resolves Home's cubit from the injector (E18-F01-S01). Stubbed empty so the
/// flow reaches the shell without a live catalog fetch.
class _MockHomeRepository extends Mock implements HomeRepository {}

const _user = AuthUser(id: 'u1', email: 'jane@example.com', name: 'Jane');

const _emptyHome = HomeSummary(
  continueWatching: <ContinueWatchingCourse>[],
  recentlyAdded: <RecentlyAddedCourse>[],
  libraryCount: 0,
);

void main() {
  late _MockAuthRepository auth;
  late _MockInstanceRepository instance;
  late _MockLibraryRepository library;
  late _MockHomeRepository home;

  setUp(() async {
    await resetInjector();
    auth = _MockAuthRepository();
    instance = _MockInstanceRepository();
    library = _MockLibraryRepository();
    home = _MockHomeRepository();
    when(
      () => instance.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(home.fetchSummary).thenAnswer((_) async => _emptyHome);
    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(auth))
      ..registerLazySingleton<AuthRepository>(() => auth)
      ..registerLazySingleton<InstanceRepository>(() => instance)
      ..registerLazySingleton<LibraryRepository>(() => library)
      ..registerFactory<HomeCubit>(() => HomeCubit(home));
  });

  tearDown(resetInjector);

  Widget harness() => TranslationProvider(child: const App());

  testWidgets('an empty install routes to the sign-up wizard as the root', (
    tester,
  ) async {
    when(() => auth.getSession()).thenAnswer((_) async => null);
    when(() => instance.hasUsers()).thenAnswer((_) async => false);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    expect(find.byType(SignUpScreen), findsOneWidget);
    expect(find.byType(SignInScreen), findsNothing);
    // As the root it carries no back affordance — nothing sits behind it.
    expect(find.byKey(const ValueKey('authBack')), findsNothing);
  });

  testWidgets('first-user signup registers a library and reaches the shell', (
    tester,
  ) async {
    when(() => auth.getSession()).thenAnswer((_) async => null);
    when(() => instance.hasUsers()).thenAnswer((_) async => false);
    when(
      () => auth.signUp(
        name: any(named: 'name'),
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => _user);
    when(
      () => library.registerLibrary(
        name: any(named: 'name'),
        rootPath: any(named: 'rootPath'),
      ),
    ).thenAnswer((_) async {});

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('signUpNameField')),
      'Jane',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signUpEmailField')),
      'jane@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signUpPasswordField')),
      'password123',
    );
    await tester.tap(find.byKey(const ValueKey('signUpSubmit')));
    await tester.pumpAndSettle();

    // Verification is off in defaults, so step 1 lands straight on Library.
    expect(find.byKey(const ValueKey('signUpFinish')), findsOneWidget);

    // The session created on step 1 is adopted when the wizard finishes.
    when(() => auth.getSession()).thenAnswer((_) async => _user);

    await tester.enterText(
      find.byKey(const ValueKey('signUpLibraryNameField')),
      'Computer Science',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signUpLibraryPathField')),
      '/srv/courses/cs',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('signUpFinish')));
    await tester.pumpAndSettle();

    expect(find.byType(MainShell), findsOneWidget);
    verify(
      () => library.registerLibrary(
        name: 'Computer Science',
        rootPath: '/srv/courses/cs',
      ),
    ).called(1);
  });
}

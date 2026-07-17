import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
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
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

class _MockLibraryRepository extends Mock implements LibraryRepository {}

const _user = AuthUser(id: 'u1', email: 'jane@example.com', name: 'Jane');

/// Pumps the real composition root (`App`), the same widget `main()` ships —
/// so these exercise `AuthGate` → the screens → their cubits end to end, with
/// only the network ports mocked.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late _MockAuthRepository auth;
  late _MockInstanceRepository instance;
  late _MockLibraryRepository library;

  setUp(() async {
    await resetInjector();
    auth = _MockAuthRepository();
    instance = _MockInstanceRepository();
    library = _MockLibraryRepository();

    when(
      () => instance.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);

    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(auth))
      ..registerLazySingleton<AuthRepository>(() => auth)
      ..registerLazySingleton<InstanceRepository>(() => instance)
      ..registerLazySingleton<LibraryRepository>(() => library);
  });

  tearDown(resetInjector);

  Widget harness() => TranslationProvider(child: const App());

  testWidgets('happy-path sign-in reaches the shell', (tester) async {
    when(() => auth.getSession()).thenAnswer((_) async => null);
    when(() => instance.hasUsers()).thenAnswer((_) async => true);
    when(
      () => auth.signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => _user);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    // Users exist, so the gate opens on sign-in, not the first-run wizard.
    expect(find.byType(SignInScreen), findsOneWidget);
    expect(find.byType(SignUpScreen), findsNothing);

    await tester.enterText(
      find.byKey(const ValueKey('signInEmailField')),
      'jane@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signInPasswordField')),
      'password123',
    );
    await tester.tap(find.byKey(const ValueKey('signInSubmit')));
    await tester.pumpAndSettle();

    expect(find.byType(MainShell), findsOneWidget);
    verify(
      () => auth.signIn(email: 'jane@example.com', password: 'password123'),
    ).called(1);
  });

  testWidgets('first-user signup bootstraps the admin and reaches the shell', (
    tester,
  ) async {
    when(() => auth.getSession()).thenAnswer((_) async => null);
    // Empty install: the gate routes straight to the sign-up wizard.
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
    // After the wizard finishes it adopts the session it created on step 1.
    when(() => auth.getSession()).thenAnswer((_) async => null);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    expect(find.byType(SignUpScreen), findsOneWidget);
    expect(find.byType(SignInScreen), findsNothing);

    // Step 1 — Account.
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
    // Verification is off in defaults, so this jumps straight to Library.
    await tester.tap(find.byKey(const ValueKey('signUpSubmit')));
    await tester.pumpAndSettle();

    // Step 3 — Library. From here on the session must exist for the finish.
    when(() => auth.getSession()).thenAnswer((_) async => _user);
    expect(find.byKey(const ValueKey('signUpFinish')), findsOneWidget);

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
      () => auth.signUp(
        name: 'Jane',
        email: 'jane@example.com',
        password: 'password123',
      ),
    ).called(1);
    verify(
      () => library.registerLibrary(
        name: 'Computer Science',
        rootPath: '/srv/courses/cs',
      ),
    ).called(1);
  });
}

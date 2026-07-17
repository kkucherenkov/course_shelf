import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

/// SignUpCubit resolves both of these from the injector (E18-F03-S01).
class _MockInstanceRepository extends Mock implements InstanceRepository {}

class _MockLibraryRepository extends Mock implements LibraryRepository {}

const _user = AuthUser(id: 'u1', email: 'user@example.com', name: 'Jane Doe');

// SignUpScreen no longer owns an AuthCubit — `App` provides one above the
// Navigator so the gate and the pushed auth routes share a single session.
Widget _harness() => TranslationProvider(
  child: BlocProvider<AuthCubit>(
    create: (_) => getIt<AuthCubit>(),
    // The brand theme carries the AppSemanticColors extension that the
    // app_ui components read; a bare MaterialApp has none and they throw.
    // `App` supplies it in production.
    child: MaterialApp(
      theme: AppTheme.light(),
      onGenerateRoute: onGenerateRoute,
      home: const SignUpScreen(),
    ),
  ),
);

void main() {
  late _MockAuthRepository repository;
  late _MockInstanceRepository instanceRepository;
  late _MockLibraryRepository libraryRepository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    instanceRepository = _MockInstanceRepository();
    libraryRepository = _MockLibraryRepository();
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instanceRepository.hasUsers()).thenAnswer((_) async => true);
    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(repository))
      ..registerLazySingleton<AuthRepository>(() => repository)
      ..registerLazySingleton<InstanceRepository>(() => instanceRepository)
      ..registerLazySingleton<LibraryRepository>(() => libraryRepository);
  });

  tearDown(resetInjector);

  testWidgets('renders name, email and password fields', (tester) async {
    await tester.pumpWidget(_harness());

    expect(find.byKey(const ValueKey('signUpNameField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signUpEmailField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signUpPasswordField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signUpSubmit')), findsOneWidget);
  });

  testWidgets('valid input calls AuthRepository.signUp', (tester) async {
    when(
      () => repository.signUp(
        name: any(named: 'name'),
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => _user);

    await tester.pumpWidget(_harness());

    await tester.enterText(
      find.byKey(const ValueKey('signUpNameField')),
      'Jane Doe',
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
    await tester.pump();

    verify(
      () => repository.signUp(
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      ),
    ).called(1);
  });
}

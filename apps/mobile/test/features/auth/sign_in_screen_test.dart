import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

/// SignInCubit resolves this from the injector for the SSO row / sign-up CTA.
class _MockInstanceRepository extends Mock implements InstanceRepository {}

const _user = AuthUser(id: 'u1', email: 'user@example.com', name: 'User');

Widget _harness() => TranslationProvider(
  child: BlocProvider<AuthCubit>(
    create: (_) => getIt<AuthCubit>(),
    // The brand theme carries the AppSemanticColors extension that the
    // app_ui components read; a bare MaterialApp has none and they throw.
    // `App` supplies it in production.
    child: MaterialApp(
      theme: AppTheme.light(),
      onGenerateRoute: onGenerateRoute,
      home: const SignInScreen(),
    ),
  ),
);

void main() {
  late _MockAuthRepository repository;
  late _MockInstanceRepository instanceRepository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    instanceRepository = _MockInstanceRepository();
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instanceRepository.hasUsers()).thenAnswer((_) async => true);
    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(repository))
      ..registerLazySingleton<InstanceRepository>(() => instanceRepository);
  });

  tearDown(resetInjector);

  testWidgets('renders the email + password form (email is primary)', (
    tester,
  ) async {
    await tester.pumpWidget(_harness());

    expect(find.byKey(const ValueKey('signInEmailField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signInPasswordField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signInSubmit')), findsOneWidget);
  });

  testWidgets('invalid email blocks submit and shows a validation error', (
    tester,
  ) async {
    await tester.pumpWidget(_harness());

    await tester.enterText(
      find.byKey(const ValueKey('signInEmailField')),
      'not-an-email',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signInPasswordField')),
      'longenough',
    );
    await tester.tap(find.byKey(const ValueKey('signInSubmit')));
    await tester.pump();

    expect(find.text('Please enter a valid email.'), findsOneWidget);
    verifyNever(
      () => repository.signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    );
  });

  testWidgets('valid credentials call AuthRepository.signIn', (tester) async {
    when(
      () => repository.signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => _user);

    await tester.pumpWidget(_harness());

    await tester.enterText(
      find.byKey(const ValueKey('signInEmailField')),
      'user@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signInPasswordField')),
      'password123',
    );
    await tester.tap(find.byKey(const ValueKey('signInSubmit')));
    await tester.pump();

    verify(
      () =>
          repository.signIn(email: 'user@example.com', password: 'password123'),
    ).called(1);
  });
}

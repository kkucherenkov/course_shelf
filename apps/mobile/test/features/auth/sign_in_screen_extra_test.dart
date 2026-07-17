import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/domain/auth_exception.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

const _ssoConfig = InstanceConfig(
  selfRegistration: true,
  emailVerificationRequired: false,
  ssoProviders: <String>['google', 'github'],
);

const _noRegistrationConfig = InstanceConfig(
  selfRegistration: false,
  emailVerificationRequired: false,
  ssoProviders: <String>[],
);

void main() {
  late _MockAuthRepository repository;
  late _MockInstanceRepository instanceRepository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    instanceRepository = _MockInstanceRepository();
    when(() => instanceRepository.hasUsers()).thenAnswer((_) async => true);
    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(repository))
      ..registerLazySingleton<InstanceRepository>(() => instanceRepository);
  });

  tearDown(resetInjector);

  Widget harness() => TranslationProvider(
    child: BlocProvider<AuthCubit>(
      create: (_) => getIt<AuthCubit>(),
      child: MaterialApp(
        theme: AppTheme.light(),
        onGenerateRoute: onGenerateRoute,
        home: const SignInScreen(),
      ),
    ),
  );

  testWidgets('renders no SSO row when the instance advertises none', (
    tester,
  ) async {
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    // skipOffstage defaults true, so this is a genuine "not built", not a
    // zero-extent hit — exactly the trap the brief flagged.
    expect(find.byKey(const ValueKey('signInSsoBlock')), findsNothing);
  });

  testWidgets('renders the SSO row when the instance advertises providers', (
    tester,
  ) async {
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => _ssoConfig);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('signInSsoBlock')), findsOneWidget);
  });

  testWidgets('hides the sign-up CTA when self-registration is disabled', (
    tester,
  ) async {
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => _noRegistrationConfig);

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('signInSignUpLink')), findsNothing);
  });

  testWidgets('a 429 shows the rate-limit banner, not the generic error', (
    tester,
  ) async {
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(
      () => repository.signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenThrow(
      const AuthException(
        message: 'Too many requests',
        statusCode: 429,
        retryAfterSeconds: 45,
      ),
    );

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('signInEmailField')),
      'user@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('signInPasswordField')),
      'password123',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('signInSubmit')));
    await tester.pump(); // let the error propagate; do NOT settle the countdown

    expect(find.byKey(const ValueKey('signInRateLimitBanner')), findsOneWidget);
    expect(find.byKey(const ValueKey('signInErrorBanner')), findsNothing);

    // During the rate-limit window the submit must be a *disabled* button —
    // proving the limit actually blocks it (semantics layer, since tester.tap
    // would silently no-op on a disabled control and pass regardless).
    expect(
      tester.getSemantics(find.bySemanticsLabel('Sign in')),
      isSemantics(isButton: true, hasEnabledState: true, isEnabled: false),
    );
  });
}

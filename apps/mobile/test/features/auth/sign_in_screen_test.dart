import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/phone_auth_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

const _user = AuthUser(id: 'u1', email: 'user@example.com', name: 'User');

Widget _harness() => TranslationProvider(
      child: const MaterialApp(
        onGenerateRoute: onGenerateRoute,
        home: SignInScreen(),
      ),
    );

void main() {
  late _MockAuthRepository repository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    getIt.registerFactory<AuthCubit>(() => AuthCubit(repository));
  });

  tearDown(resetInjector);

  testWidgets('renders the email + password form (email is primary)',
      (tester) async {
    await tester.pumpWidget(_harness());

    expect(find.byKey(const ValueKey('signInEmailField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signInPasswordField')), findsOneWidget);
    expect(find.byKey(const ValueKey('signInSubmit')), findsOneWidget);
    // The phone path is present but secondary — a link, not the main form.
    expect(find.byKey(const ValueKey('signInPhoneLink')), findsOneWidget);
  });

  testWidgets('invalid email blocks submit and shows a validation error',
      (tester) async {
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
      () => repository.signIn(
        email: 'user@example.com',
        password: 'password123',
      ),
    ).called(1);
  });

  testWidgets('the phone link routes to the secondary PhoneAuthScreen',
      (tester) async {
    await tester.pumpWidget(_harness());

    await tester.tap(find.byKey(const ValueKey('signInPhoneLink')));
    await tester.pumpAndSettle();

    expect(find.byType(PhoneAuthScreen), findsOneWidget);
  });
}

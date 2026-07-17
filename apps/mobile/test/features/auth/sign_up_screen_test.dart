import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

const _user = AuthUser(id: 'u1', email: 'user@example.com', name: 'Jane Doe');

// SignUpScreen no longer owns an AuthCubit — `App` provides one above the
// Navigator so the gate and the pushed auth routes share a single session.
Widget _harness() => TranslationProvider(
      child: BlocProvider<AuthCubit>(
        create: (_) => getIt<AuthCubit>(),
        child: const MaterialApp(
          onGenerateRoute: onGenerateRoute,
          home: SignUpScreen(),
        ),
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

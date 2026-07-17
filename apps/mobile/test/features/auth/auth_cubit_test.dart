import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

const _user = AuthUser(id: 'u1', email: 'test@example.com', name: 'Test User');

void main() {
  late _MockAuthRepository repository;

  setUp(() {
    repository = _MockAuthRepository();
  });

  group('checkSession', () {
    blocTest<AuthCubit, AuthState>(
      'emits only authenticated when a session exists (no authenticating)',
      build: () {
        when(() => repository.getSession()).thenAnswer((_) async => _user);
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticated, user: _user),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits only unauthenticated when there is no session',
      build: () {
        when(() => repository.getSession()).thenAnswer((_) async => null);
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.unauthenticated),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits only unauthenticated on exception',
      build: () {
        when(() => repository.getSession()).thenThrow(Exception('network'));
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.unauthenticated),
      ],
    );
  });

  group('signIn', () {
    blocTest<AuthCubit, AuthState>(
      'emits authenticating then authenticated on success',
      build: () {
        when(
          () => repository.signIn(
            email: 'test@example.com',
            password: 'pass',
          ),
        ).thenAnswer((_) async => _user);
        return AuthCubit(repository);
      },
      act: (cubit) =>
          cubit.signIn(email: 'test@example.com', password: 'pass'),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(status: AuthStatus.authenticated, user: _user),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then error on exception',
      build: () {
        when(
          () => repository.signIn(
            email: any(named: 'email'),
            password: any(named: 'password'),
          ),
        ).thenThrow(Exception('bad credentials'));
        return AuthCubit(repository);
      },
      act: (cubit) =>
          cubit.signIn(email: 'x@x.com', password: 'wrong'),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(
          status: AuthStatus.error,
          errorMessage: 'Exception: bad credentials',
        ),
      ],
    );
  });

  group('signOut', () {
    blocTest<AuthCubit, AuthState>(
      'emits unauthenticated after sign-out',
      build: () {
        when(() => repository.signOut()).thenAnswer((_) async {});
        return AuthCubit(repository);
      },
      seed: () => const AuthState(
        status: AuthStatus.authenticated,
        user: _user,
      ),
      act: (cubit) => cubit.signOut(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.unauthenticated),
      ],
    );
  });
}

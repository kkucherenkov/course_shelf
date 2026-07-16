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
      'emits authenticating then authenticated when session exists',
      build: () {
        when(() => repository.getSession()).thenAnswer((_) async => _user);
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(status: AuthStatus.authenticated, user: _user),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then unauthenticated when no session',
      build: () {
        when(() => repository.getSession()).thenAnswer((_) async => null);
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(status: AuthStatus.unauthenticated),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then unauthenticated on exception',
      build: () {
        when(() => repository.getSession()).thenThrow(Exception('network'));
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.checkSession(),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
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

  group('requestOtp', () {
    const phone = '+35799123456';

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then otpSent (capturing the phone) on success',
      build: () {
        when(() => repository.requestOtp(phone: any(named: 'phone')))
            .thenAnswer((_) async {});
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.requestOtp(phone: phone),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(status: AuthStatus.otpSent, phone: phone),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then error(invalid-phone) on OtpError',
      build: () {
        when(() => repository.requestOtp(phone: any(named: 'phone')))
            .thenThrow(const OtpError(OtpErrorKind.invalid));
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.requestOtp(phone: phone),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(
          status: AuthStatus.error,
          errorMessage: 'invalid-phone',
        ),
      ],
    );
  });

  group('verifyOtp', () {
    const phone = '+35799123456';

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then authenticated on success',
      build: () {
        when(
          () => repository.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
            name: any(named: 'name'),
          ),
        ).thenAnswer(
          (_) async => const VerifyOtpResult(user: _user, isNewUser: false),
        );
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.verifyOtp(phone: phone, code: '123456', name: ''),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(status: AuthStatus.authenticated, user: _user),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits authenticating then otpSent(otp-mismatch) on a mismatch OtpError',
      build: () {
        when(
          () => repository.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
            name: any(named: 'name'),
          ),
        ).thenThrow(const OtpError(OtpErrorKind.mismatch));
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.verifyOtp(phone: phone, code: '000000', name: ''),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(
          status: AuthStatus.otpSent,
          errorMessage: 'otp-mismatch',
          phone: phone,
        ),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'maps an expired OtpError to otpSent(otp-expired)',
      build: () {
        when(
          () => repository.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
            name: any(named: 'name'),
          ),
        ).thenThrow(const OtpError(OtpErrorKind.expired));
        return AuthCubit(repository);
      },
      act: (cubit) => cubit.verifyOtp(phone: phone, code: '000000', name: ''),
      expect: () => <AuthState>[
        const AuthState(status: AuthStatus.authenticating),
        const AuthState(
          status: AuthStatus.otpSent,
          errorMessage: 'otp-expired',
          phone: phone,
        ),
      ],
    );
  });

  group('resetToPhoneStep', () {
    blocTest<AuthCubit, AuthState>(
      'clears back to the initial phone-entry state',
      build: () => AuthCubit(repository),
      seed: () => const AuthState(
        status: AuthStatus.otpSent,
        phone: '+35799123456',
        errorMessage: 'otp-mismatch',
      ),
      act: (cubit) => cubit.resetToPhoneStep(),
      expect: () => <AuthState>[const AuthState()],
    );
  });
}

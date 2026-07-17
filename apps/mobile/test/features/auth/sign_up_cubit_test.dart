import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/domain/auth_exception.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/domain/library_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_up_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_up_state.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

class _MockLibraryRepository extends Mock implements LibraryRepository {}

const _user = AuthUser(id: 'u1', email: 'jane@example.com', name: 'Jane');

const _verifyingConfig = InstanceConfig(
  selfRegistration: true,
  emailVerificationRequired: true,
  ssoProviders: <String>[],
);

void main() {
  late _MockAuthRepository authRepository;
  late _MockInstanceRepository instanceRepository;
  late _MockLibraryRepository libraryRepository;
  late AuthCubit authCubit;

  setUp(() {
    authRepository = _MockAuthRepository();
    instanceRepository = _MockInstanceRepository();
    libraryRepository = _MockLibraryRepository();
    authCubit = AuthCubit(authRepository);

    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instanceRepository.hasUsers()).thenAnswer((_) async => true);
  });

  tearDown(() => authCubit.close());

  SignUpCubit build() => SignUpCubit(
    authCubit: authCubit,
    authRepository: authRepository,
    instanceRepository: instanceRepository,
    libraryRepository: libraryRepository,
  );

  void stubSignUpOk() {
    when(
      () => authRepository.signUp(
        name: any(named: 'name'),
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => _user);
  }

  /// Drives step 1 to completion so a test can start from a later step.
  Future<void> completeAccount(SignUpCubit cubit) async {
    cubit
      ..setFullName('Jane')
      ..setEmail('jane@example.com')
      ..setPassword('password123');
    await cubit.submitAccount();
  }

  group('start', () {
    blocTest<SignUpCubit, SignUpState>(
      'loads the instance config and flags the first admin when the DB is empty',
      setUp: () {
        when(
          () => instanceRepository.getInstanceConfig(),
        ).thenAnswer((_) async => _verifyingConfig);
        when(
          () => instanceRepository.hasUsers(),
        ).thenAnswer((_) async => false);
      },
      build: build,
      act: (cubit) => cubit.start(),
      expect: () => [
        const SignUpState(config: _verifyingConfig, isFirstAdmin: true),
      ],
    );

    blocTest<SignUpCubit, SignUpState>(
      'does not flag the first admin when users already exist',
      build: build,
      act: (cubit) => cubit.start(),
      expect: () => [const SignUpState()],
    );
  });

  group('visibleSteps', () {
    test('omits verify when the instance does not require it', () {
      expect(const SignUpState().visibleSteps, [
        SignUpStep.account,
        SignUpStep.library,
      ]);
    });

    test('includes verify when the instance requires it', () {
      expect(const SignUpState(config: _verifyingConfig).visibleSteps, [
        SignUpStep.account,
        SignUpStep.verify,
        SignUpStep.library,
      ]);
    });
  });

  group('submitAccount', () {
    blocTest<SignUpCubit, SignUpState>(
      'skips verify and lands on library when verification is not required',
      setUp: stubSignUpOk,
      build: build,
      act: completeAccount,
      skip: 3,
      expect: () => [
        const SignUpState(
          fullName: 'Jane',
          email: 'jane@example.com',
          password: 'password123',
          isPending: true,
        ),
        const SignUpState(
          fullName: 'Jane',
          email: 'jane@example.com',
          password: 'password123',
          step: SignUpStep.library,
        ),
      ],
      verify: (_) {
        verify(
          () => authRepository.signUp(
            name: 'Jane',
            email: 'jane@example.com',
            password: 'password123',
          ),
        ).called(1);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'goes to verify and arms the resend countdown when verification is required',
      setUp: () {
        stubSignUpOk();
        when(
          () => instanceRepository.getInstanceConfig(),
        ).thenAnswer((_) async => _verifyingConfig);
      },
      build: build,
      act: (cubit) async {
        await cubit.start();
        await completeAccount(cubit);
      },
      verify: (cubit) {
        expect(cubit.state.step, SignUpStep.verify);
        // Web starts the resend countdown at 60 on entering the step.
        expect(cubit.state.resendCountdown, 60);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'does not authenticate the session cubit — that would tear the wizard down',
      setUp: stubSignUpOk,
      build: build,
      act: completeAccount,
      verify: (_) {
        // AuthGate swaps to MainShell the moment AuthCubit says authenticated.
        // If step 1 emitted it, steps 2 and 3 would never render.
        expect(authCubit.state.status, isNot(AuthStatus.authenticated));
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'maps an already-registered email to emailTaken',
      setUp: () {
        when(
          () => authRepository.signUp(
            name: any(named: 'name'),
            email: any(named: 'email'),
            password: any(named: 'password'),
          ),
        ).thenThrow(
          const AuthException(code: AuthErrorCodes.userAlreadyExists),
        );
      },
      build: build,
      act: completeAccount,
      verify: (cubit) {
        expect(cubit.state.step1Error, SignUpError.emailTaken);
        expect(cubit.state.step, SignUpStep.account);
        expect(cubit.state.isPending, isFalse);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'maps any other failure to generic',
      setUp: () {
        when(
          () => authRepository.signUp(
            name: any(named: 'name'),
            email: any(named: 'email'),
            password: any(named: 'password'),
          ),
        ).thenThrow(Exception('boom'));
      },
      build: build,
      act: completeAccount,
      verify: (cubit) {
        expect(cubit.state.step1Error, SignUpError.generic);
      },
    );
  });

  group('verify step', () {
    blocTest<SignUpCubit, SignUpState>(
      'setDigit fills one cell and fullCode joins them',
      build: build,
      act: (cubit) {
        for (var i = 0; i < 6; i++) {
          cubit.setDigit(i, '${i + 1}');
        }
      },
      verify: (cubit) {
        expect(cubit.state.fullCode, '123456');
        expect(cubit.state.canSubmitVerify, isTrue);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'a verified code advances to library',
      setUp: () {
        stubSignUpOk();
        when(
          () => instanceRepository.getInstanceConfig(),
        ).thenAnswer((_) async => _verifyingConfig);
        when(
          () => authRepository.verifyEmail(
            email: any(named: 'email'),
            code: any(named: 'code'),
          ),
        ).thenAnswer((_) async {});
      },
      build: build,
      act: (cubit) async {
        await cubit.start();
        await completeAccount(cubit);
        for (var i = 0; i < 6; i++) {
          cubit.setDigit(i, '1');
        }
        await cubit.submitVerify();
      },
      verify: (cubit) {
        expect(cubit.state.step, SignUpStep.library);
        verify(
          () => authRepository.verifyEmail(
            email: 'jane@example.com',
            code: '111111',
          ),
        ).called(1);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'a rejected code keeps the user on verify',
      setUp: () {
        stubSignUpOk();
        when(
          () => instanceRepository.getInstanceConfig(),
        ).thenAnswer((_) async => _verifyingConfig);
        when(
          () => authRepository.verifyEmail(
            email: any(named: 'email'),
            code: any(named: 'code'),
          ),
        ).thenThrow(Exception('INVALID_OTP'));
      },
      build: build,
      act: (cubit) async {
        await cubit.start();
        await completeAccount(cubit);
        for (var i = 0; i < 6; i++) {
          cubit.setDigit(i, '9');
        }
        await cubit.submitVerify();
      },
      verify: (cubit) {
        expect(cubit.state.step, SignUpStep.verify);
        expect(cubit.state.step2Error, SignUpError.verifyFailed);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'editEmail returns to account and drops the stale code',
      setUp: () {
        stubSignUpOk();
        when(
          () => instanceRepository.getInstanceConfig(),
        ).thenAnswer((_) async => _verifyingConfig);
      },
      build: build,
      act: (cubit) async {
        await cubit.start();
        await completeAccount(cubit);
        for (var i = 0; i < 6; i++) {
          cubit.setDigit(i, '7');
        }
        cubit.editEmail();
      },
      verify: (cubit) {
        expect(cubit.state.step, SignUpStep.account);
        expect(cubit.state.fullCode, isEmpty);
        expect(cubit.state.step2Error, isNull);
        expect(cubit.state.resendCountdown, 0);
      },
    );
  });

  group('library step', () {
    blocTest<SignUpCubit, SignUpState>(
      'registers the library, adopts the session and finishes',
      setUp: () {
        stubSignUpOk();
        when(
          () => libraryRepository.registerLibrary(
            name: any(named: 'name'),
            rootPath: any(named: 'rootPath'),
          ),
        ).thenAnswer((_) async {});
        when(() => authRepository.getSession()).thenAnswer((_) async => _user);
      },
      build: build,
      act: (cubit) async {
        await completeAccount(cubit);
        cubit
          ..setLibraryName('Computer Science')
          ..setLibraryPath('  /srv/courses/cs  ');
        await cubit.submitLibrary();
      },
      verify: (cubit) {
        expect(cubit.state.done, isTrue);
        // Web trims the path before posting it.
        verify(
          () => libraryRepository.registerLibrary(
            name: 'Computer Science',
            rootPath: '/srv/courses/cs',
          ),
        ).called(1);
        // Only now may the gate swap to the shell.
        expect(authCubit.state.status, AuthStatus.authenticated);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'a rejected path keeps the user on library and does not finish',
      setUp: () {
        stubSignUpOk();
        when(
          () => libraryRepository.registerLibrary(
            name: any(named: 'name'),
            rootPath: any(named: 'rootPath'),
          ),
        ).thenThrow(Exception('ENOENT'));
      },
      build: build,
      act: (cubit) async {
        await completeAccount(cubit);
        cubit
          ..setLibraryName('CS')
          ..setLibraryPath('/nope');
        await cubit.submitLibrary();
      },
      verify: (cubit) {
        expect(cubit.state.step3Error, SignUpError.libraryPath);
        expect(cubit.state.step, SignUpStep.library);
        expect(cubit.state.done, isFalse);
      },
    );

    blocTest<SignUpCubit, SignUpState>(
      'skipLibrary finishes without registering anything',
      setUp: () {
        stubSignUpOk();
        when(() => authRepository.getSession()).thenAnswer((_) async => _user);
      },
      build: build,
      act: (cubit) async {
        await completeAccount(cubit);
        await cubit.skipLibrary();
      },
      verify: (cubit) {
        expect(cubit.state.done, isTrue);
        verifyNever(
          () => libraryRepository.registerLibrary(
            name: any(named: 'name'),
            rootPath: any(named: 'rootPath'),
          ),
        );
        expect(authCubit.state.status, AuthStatus.authenticated);
      },
    );
  });
}

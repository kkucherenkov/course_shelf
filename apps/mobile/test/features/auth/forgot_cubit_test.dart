import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/forgot_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/forgot_state.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late _MockAuthRepository repository;

  setUp(() {
    repository = _MockAuthRepository();
  });

  ForgotCubit build({String resetToken = ''}) =>
      ForgotCubit(authRepository: repository, resetToken: resetToken);

  group('initial step', () {
    test('starts on email when no reset token was supplied', () {
      expect(build().state.step, ForgotStep.email);
    });

    test('starts on reset when a deep-link token was supplied', () {
      // Web reaches this via `?token=` in the URL; mobile via the route arg.
      final cubit = build(resetToken: 'tok-123');
      expect(cubit.state.step, ForgotStep.reset);
      expect(cubit.state.resetToken, 'tok-123');
    });
  });

  group('submitEmail', () {
    blocTest<ForgotCubit, ForgotState>(
      'requests a reset link and advances to sent',
      setUp: () {
        when(
          () => repository.requestPasswordReset(email: any(named: 'email')),
        ).thenAnswer((_) async {});
      },
      build: build,
      act: (cubit) async {
        cubit.setEmail('user@example.com');
        await cubit.submitEmail();
      },
      expect: () => [
        const ForgotState(email: 'user@example.com'),
        const ForgotState(email: 'user@example.com', isPending: true),
        const ForgotState(email: 'user@example.com', step: ForgotStep.sent),
      ],
      verify: (_) {
        verify(
          () => repository.requestPasswordReset(email: 'user@example.com'),
        ).called(1);
      },
    );

    blocTest<ForgotCubit, ForgotState>(
      'surfaces a failure instead of falsely advancing to sent',
      setUp: () {
        when(
          () => repository.requestPasswordReset(email: any(named: 'email')),
        ).thenThrow(Exception('RESET_PASSWORD_DISABLED'));
      },
      build: build,
      act: (cubit) async {
        cubit.setEmail('user@example.com');
        await cubit.submitEmail();
      },
      expect: () => [
        const ForgotState(email: 'user@example.com'),
        const ForgotState(email: 'user@example.com', isPending: true),
        const ForgotState(
          email: 'user@example.com',
          errorMessage: ForgotError.generic,
        ),
      ],
    );
  });

  group('submitReset', () {
    blocTest<ForgotCubit, ForgotState>(
      'rejects mismatched passwords without calling the server',
      build: () => build(resetToken: 'tok-123'),
      act: (cubit) async {
        cubit.setNewPassword('password123');
        cubit.setConfirmPassword('password124');
        await cubit.submitReset();
      },
      skip: 2,
      expect: () => [
        const ForgotState(
          step: ForgotStep.reset,
          resetToken: 'tok-123',
          newPassword: 'password123',
          confirmPassword: 'password124',
          errorMessage: ForgotError.passwordMismatch,
        ),
      ],
      verify: (_) {
        verifyNever(
          () => repository.resetPassword(
            token: any(named: 'token'),
            newPassword: any(named: 'newPassword'),
          ),
        );
      },
    );

    blocTest<ForgotCubit, ForgotState>(
      'errors when the token is missing',
      build: build,
      act: (cubit) async {
        cubit.setNewPassword('password123');
        cubit.setConfirmPassword('password123');
        await cubit.submitReset();
      },
      skip: 2,
      expect: () => [
        const ForgotState(
          newPassword: 'password123',
          confirmPassword: 'password123',
          errorMessage: ForgotError.tokenMissing,
        ),
      ],
      verify: (_) {
        verifyNever(
          () => repository.resetPassword(
            token: any(named: 'token'),
            newPassword: any(named: 'newPassword'),
          ),
        );
      },
    );

    blocTest<ForgotCubit, ForgotState>(
      'resets the password and flags done',
      setUp: () {
        when(
          () => repository.resetPassword(
            token: any(named: 'token'),
            newPassword: any(named: 'newPassword'),
          ),
        ).thenAnswer((_) async {});
      },
      build: () => build(resetToken: 'tok-123'),
      act: (cubit) async {
        cubit.setNewPassword('password123');
        cubit.setConfirmPassword('password123');
        await cubit.submitReset();
      },
      skip: 2,
      expect: () => [
        const ForgotState(
          step: ForgotStep.reset,
          resetToken: 'tok-123',
          newPassword: 'password123',
          confirmPassword: 'password123',
          isPending: true,
        ),
        const ForgotState(
          step: ForgotStep.reset,
          resetToken: 'tok-123',
          newPassword: 'password123',
          confirmPassword: 'password123',
          done: true,
        ),
      ],
      verify: (_) {
        verify(
          () => repository.resetPassword(
            token: 'tok-123',
            newPassword: 'password123',
          ),
        ).called(1);
      },
    );

    blocTest<ForgotCubit, ForgotState>(
      'surfaces an expired-token failure',
      setUp: () {
        when(
          () => repository.resetPassword(
            token: any(named: 'token'),
            newPassword: any(named: 'newPassword'),
          ),
        ).thenThrow(Exception('INVALID_TOKEN'));
      },
      build: () => build(resetToken: 'tok-123'),
      act: (cubit) async {
        cubit.setNewPassword('password123');
        cubit.setConfirmPassword('password123');
        await cubit.submitReset();
      },
      skip: 3,
      expect: () => [
        const ForgotState(
          step: ForgotStep.reset,
          resetToken: 'tok-123',
          newPassword: 'password123',
          confirmPassword: 'password123',
          errorMessage: ForgotError.generic,
        ),
      ],
    );
  });
}

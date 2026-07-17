import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_up_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_up_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_stepper.dart';
import 'package:app_mobile/features/auth/presentation/widgets/otp_code_field.dart';
import 'package:app_mobile/features/auth/presentation/widgets/sso_providers.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// Localizes a [SignUpError]. The cubit carries codes, not strings — see
/// [SignUpError] for why.
String _errorTextFor(BuildContext context, SignUpError error) {
  final t = context.t.auth.signUp;
  return switch (error) {
    SignUpError.emailTaken => t.errorEmailTaken,
    SignUpError.libraryPath => t.errorLibraryPath,
    SignUpError.verifyFailed => t.errorVerifyFailed,
    SignUpError.generic => t.errorGeneric(error: ''),
  };
}

/// Three-step registration wizard — Account → (Verify) → Library.
///
/// Reached from the "no account? sign up" link on `SignInScreen`. Mirrors
/// `apps/web/app/pages/sign-up.vue`; see [SignUpCubit] for the flow and
/// [SignUpState] for the field mapping.
class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key, this.showBack = true});

  /// False when the wizard IS the unauthenticated root — the first-run case,
  /// where there is no sign-in screen behind it to go back to.
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SignUpCubit>(
      // AuthCubit comes from context, NOT get_it — see SignInScreen for why a
      // pushed route must not mint its own session cubit.
      create: (_) => SignUpCubit(
        authCubit: context.read<AuthCubit>(),
        authRepository: getIt(),
        instanceRepository: getIt(),
        libraryRepository: getIt(),
      )..start(),
      child: _SignUpView(showBack: showBack),
    );
  }
}

class _SignUpView extends StatelessWidget {
  const _SignUpView({required this.showBack});

  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SignUpCubit, SignUpState>(
      listenWhen: (previous, current) => previous.done != current.done,
      listener: (context, state) {
        if (state.done) {
          // The cubit adopted the session, so AuthGate is already rebuilding
          // into the shell; drop the pushed auth routes behind it.
          Navigator.popUntil(context, (route) => route.isFirst);
        }
      },
      builder: (context, state) {
        // Self-registration off: the whole wizard is replaced, as on web.
        if (!state.config.selfRegistration) {
          return _RegistrationClosed(showBack: showBack);
        }
        return switch (state.step) {
          SignUpStep.account => _AccountStep(showBack: showBack),
          // Steps 2 and 3 never show a back affordance: the account already
          // exists by then, so there is nothing to go back to. Web is the same
          // — its wizard has no back control either.
          SignUpStep.verify => const _VerifyStep(),
          SignUpStep.library => const _LibraryStep(),
        };
      },
    );
  }
}

/// Shown when `instance.selfRegistration` is false.
class _RegistrationClosed extends StatelessWidget {
  const _RegistrationClosed({required this.showBack});

  final bool showBack;

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    return AuthScaffold(
      key: const ValueKey('signUpDisabled'),
      showBack: showBack,
      action: AppButton(
        label: t.signInLink,
        block: true,
        variant: AppButtonVariant.secondary,
        onPressed: () => Navigator.of(context).pop(),
      ),
      child: AppNoPermission(
        icon: IconName.lock,
        title: t.disabledTitle,
        message: t.disabledBody,
      ),
    );
  }
}

/// Progress header, sized to the *visible* steps — 2 when the instance does
/// not require email verification, 3 when it does.
class _Stepper extends StatelessWidget {
  const _Stepper({required this.state});

  final SignUpState state;

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    String labelFor(SignUpStep step) => switch (step) {
      SignUpStep.account => t.stepAccount,
      SignUpStep.verify => t.stepVerify,
      SignUpStep.library => t.stepLibrary,
    };

    return AuthStepper(
      current: state.step.name,
      steps: [
        for (final step in state.visibleSteps)
          AuthStepDef(id: step.name, label: labelFor(step)),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppSpacing.s2),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _AccountStep extends StatelessWidget {
  const _AccountStep({required this.showBack});

  final bool showBack;

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    final state = context.watch<SignUpCubit>().state;
    final cubit = context.read<SignUpCubit>();
    final error = state.step1Error;

    return AuthScaffold(
      showBack: showBack,
      action: AppButton(
        key: const ValueKey('signUpSubmit'),
        label: t.continueButton,
        block: true,
        loading: state.isPending,
        iconTrailing: IconName.arrowRight,
        onPressed: cubit.submitAccount,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Stepper(state: state),
          const SizedBox(height: AppSpacing.s6),
          // First run on an empty server: this account becomes the admin.
          _Header(
            title: state.isFirstAdmin ? t.setupTitle : t.title,
            subtitle: state.isFirstAdmin ? t.setupSubtitle : t.subtitle,
          ),
          const SizedBox(height: AppSpacing.s6),
          if (error != null) ...[
            AppBanner(
              key: const ValueKey('signUpErrorBanner'),
              variant: AppFeedbackVariant.error,
              body: _errorTextFor(context, error),
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          AppTextField(
            key: const ValueKey('signUpNameField'),
            label: t.nameLabel,
            value: state.fullName,
            onChanged: cubit.setFullName,
            placeholder: t.nameHint,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s4),
          AppTextField(
            key: const ValueKey('signUpEmailField'),
            label: t.emailLabel,
            value: state.email,
            onChanged: cubit.setEmail,
            type: AppTextFieldType.email,
            placeholder: t.emailHint,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s4),
          AppPasswordField(
            key: const ValueKey('signUpPasswordField'),
            label: t.passwordLabel,
            value: state.password,
            onChanged: cubit.setPassword,
            autoComplete: AppPasswordAutoComplete.newPassword,
            withMeter: true,
            help: t.passwordHint,
            required: true,
          ),
          if (state.config.ssoProviders.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s5),
            AppSsoBlock(
              key: const ValueKey('signUpSsoBlock'),
              providers: ssoProvidersFor(context, state.config.ssoProviders),
            ),
          ],
          const SizedBox(height: AppSpacing.s5),
          _FootLink(
            text: t.hasAccount,
            linkKey: const ValueKey('signUpSignInLink'),
            linkLabel: t.signInLink,
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}

class _VerifyStep extends StatelessWidget {
  const _VerifyStep();

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    final theme = Theme.of(context);
    final state = context.watch<SignUpCubit>().state;
    final cubit = context.read<SignUpCubit>();
    final error = state.step2Error;

    return AuthScaffold(
      showBack: false,
      action: AppButton(
        key: const ValueKey('signUpVerifySubmit'),
        label: t.verifyButton,
        block: true,
        loading: state.isPending,
        disabled: !state.canSubmitVerify,
        iconTrailing: IconName.arrowRight,
        onPressed: cubit.submitVerify,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Stepper(state: state),
          const SizedBox(height: AppSpacing.s6),
          _Header(
            title: t.verifyTitle,
            subtitle: t.verifySubtitle(email: state.email),
          ),
          const SizedBox(height: AppSpacing.s6),
          if (error != null) ...[
            AppBanner(
              key: const ValueKey('signUpVerifyErrorBanner'),
              variant: AppFeedbackVariant.error,
              body: _errorTextFor(context, error),
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          OtpCodeField(
            digits: state.verifyCode,
            onChanged: cubit.setDigit,
            groupLabel: t.verifyCodeLabel,
            digitLabel: (n) => t.verifyDigitLabel(n: n),
          ),
          const SizedBox(height: AppSpacing.s4),
          if (state.resendCountdown > 0)
            Text(
              t.resendCountdown(n: state.resendCountdown),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            )
          else
            Center(
              child: AppButton(
                key: const ValueKey('signUpResend'),
                label: t.resendButton,
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.sm,
                onPressed: cubit.resend,
              ),
            ),
          const SizedBox(height: AppSpacing.s5),
          _FootLink(
            text: t.wrongEmail,
            linkKey: const ValueKey('signUpEditEmail'),
            linkLabel: t.editEmail,
            onPressed: cubit.editEmail,
          ),
        ],
      ),
    );
  }
}

class _LibraryStep extends StatelessWidget {
  const _LibraryStep();

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    final state = context.watch<SignUpCubit>().state;
    final cubit = context.read<SignUpCubit>();
    final error = state.step3Error;

    return AuthScaffold(
      showBack: false,
      action: AppButton(
        key: const ValueKey('signUpFinish'),
        label: t.finishButton,
        block: true,
        loading: state.isPending,
        disabled: !state.canSubmitLibrary,
        iconTrailing: IconName.arrowRight,
        onPressed: cubit.submitLibrary,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Stepper(state: state),
          const SizedBox(height: AppSpacing.s6),
          _Header(title: t.libraryTitle, subtitle: t.librarySubtitle),
          const SizedBox(height: AppSpacing.s6),
          if (error != null) ...[
            AppBanner(
              key: const ValueKey('signUpLibraryErrorBanner'),
              variant: AppFeedbackVariant.error,
              body: _errorTextFor(context, error),
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          AppTextField(
            key: const ValueKey('signUpLibraryNameField'),
            label: t.libraryNameLabel,
            value: state.libraryName,
            onChanged: cubit.setLibraryName,
            placeholder: t.libraryNameHint,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s4),
          AppTextField(
            key: const ValueKey('signUpLibraryPathField'),
            label: t.libraryPathLabel,
            value: state.libraryPath,
            onChanged: cubit.setLibraryPath,
            placeholder: t.libraryPathPlaceholder,
            help: t.libraryPathHint,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s4),
          AppFieldFrame(
            label: t.libraryScanStrategyLabel,
            child: AppSelect(
              key: const ValueKey('signUpScanStrategy'),
              value: state.scanStrategy.name,
              options: [
                AppSelectOption(
                  id: ScanStrategy.auto.name,
                  label: t.libraryScanStrategyAuto,
                ),
                AppSelectOption(
                  id: ScanStrategy.frame.name,
                  label: t.libraryScanStrategyFrame,
                ),
                AppSelectOption(
                  id: ScanStrategy.skip.name,
                  label: t.libraryScanStrategySkip,
                ),
              ],
              onChanged: (id) =>
                  cubit.setScanStrategy(ScanStrategy.values.byName(id)),
            ),
          ),
          const SizedBox(height: AppSpacing.s5),
          Center(
            child: AppButton(
              key: const ValueKey('signUpSkipLibrary'),
              label: t.skipLibrary,
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: cubit.skipLibrary,
            ),
          ),
        ],
      ),
    );
  }
}

/// "text + link" footer row, repeated on every step.
class _FootLink extends StatelessWidget {
  const _FootLink({
    required this.text,
    required this.linkLabel,
    required this.onPressed,
    required this.linkKey,
  });

  final String text;
  final String linkLabel;
  final VoidCallback onPressed;
  final Key linkKey;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Flexible(
          child: Text(
            text,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        AppButton(
          key: linkKey,
          label: linkLabel,
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: onPressed,
        ),
      ],
    );
  }
}

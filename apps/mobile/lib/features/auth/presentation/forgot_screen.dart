import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/presentation/bloc/forgot_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/forgot_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// Localizes a [ForgotError]. The cubit carries codes, not strings.
String _errorTextFor(BuildContext context, ForgotError error) {
  final t = context.t.auth.forgot;
  return switch (error) {
    ForgotError.tokenMissing => t.errorTokenMissing,
    ForgotError.passwordMismatch => t.errorPasswordMismatch,
    ForgotError.generic => t.errorGeneric(error: ''),
  };
}

/// Three-step password reset — Email → Sent → Reset.
///
/// Mirrors `apps/web/app/pages/forgot.vue`. See [ForgotCubit] for the one
/// deliberate behavioural difference (web's reset calls are stubs; these are
/// real, and surface failures rather than claiming an email was sent).
class ForgotScreen extends StatelessWidget {
  const ForgotScreen({super.key, this.resetToken = ''});

  /// Token from the emailed reset link, delivered as the route argument.
  ///
  /// Web reads the equivalent from `?token=` in the URL. Wiring the deep link
  /// itself (`Info.plist` / `AndroidManifest.xml` app-link filters) is platform
  /// config and out of this card's scope, so the token arrives here from
  /// whatever registers that route; empty means the user started at step 1.
  final String resetToken;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ForgotCubit>(
      create: (_) =>
          ForgotCubit(authRepository: getIt(), resetToken: resetToken),
      child: const _ForgotView(),
    );
  }
}

class _ForgotView extends StatelessWidget {
  const _ForgotView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ForgotCubit, ForgotState>(
      listenWhen: (previous, current) => previous.done != current.done,
      listener: (context, state) {
        if (state.done) {
          // Reset does not create a session — Better Auth's `/reset-password`
          // returns no token — so the user lands back on sign-in to use the
          // new password. (Web navigates to '/', where its auth guard bounces
          // them to sign-in anyway: same destination.)
          Navigator.of(context).pop();
        }
      },
      builder: (context, state) => switch (state.step) {
        ForgotStep.email => const _EmailStep(),
        ForgotStep.sent => const _SentStep(),
        ForgotStep.reset => const _ResetStep(),
      },
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: AppSpacing.s3),
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

class _EmailStep extends StatelessWidget {
  const _EmailStep();

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.forgot;
    final state = context.watch<ForgotCubit>().state;
    final cubit = context.read<ForgotCubit>();
    final error = state.errorMessage;

    return AuthScaffold(
      action: AppButton(
        key: const ValueKey('forgotSendSubmit'),
        label: t.sendButton,
        block: true,
        loading: state.isPending,
        disabled: !state.canSubmitEmail,
        iconTrailing: IconName.arrowRight,
        onPressed: cubit.submitEmail,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(eyebrow: t.eyebrow, title: t.title, subtitle: t.subtitle),
          const SizedBox(height: AppSpacing.s6),
          if (error != null) ...[
            AppBanner(
              key: const ValueKey('forgotErrorBanner'),
              variant: AppFeedbackVariant.error,
              body: _errorTextFor(context, error),
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          AppTextField(
            key: const ValueKey('forgotEmailField'),
            label: t.emailLabel,
            value: state.email,
            onChanged: cubit.setEmail,
            type: AppTextFieldType.email,
            placeholder: t.emailHint,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s5),
          _BackToSignIn(text: t.rememberedIt, label: t.backToSignIn),
        ],
      ),
    );
  }
}

class _SentStep extends StatelessWidget {
  const _SentStep();

  /// Success check circle — a fixed icon size, not a spacing token.
  static const double _iconSize = 48;

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.forgot;
    final theme = Theme.of(context);
    final state = context.watch<ForgotCubit>().state;
    final semantic = context.semanticColors;

    return AuthScaffold(
      // Web offers a real `mailto:` link here. Opening the mail app needs a
      // url_launcher dependency this app does not carry and the card does not
      // ask for — so the CTA is the way back to sign-in, the only other action
      // web's Sent step offers.
      action: AppButton(
        key: const ValueKey('forgotSentBackToSignIn'),
        label: t.backToSignIn,
        block: true,
        variant: AppButtonVariant.secondary,
        onPressed: () => Navigator.of(context).pop(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ExcludeSemantics(
            child: Container(
              width: _iconSize,
              height: _iconSize,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: semantic.successSoft,
                shape: BoxShape.circle,
              ),
              child: IconCS(
                name: IconName.check,
                size: 22,
                color: semantic.successFg,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.s5),
          Text(
            t.sentTitle,
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: AppSpacing.s2),
          Text(
            t.sentSubtitle(email: state.email),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ResetStep extends StatelessWidget {
  const _ResetStep();

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.forgot;
    final state = context.watch<ForgotCubit>().state;
    final cubit = context.read<ForgotCubit>();
    final error = state.errorMessage;

    return AuthScaffold(
      action: AppButton(
        key: const ValueKey('forgotResetSubmit'),
        label: t.updateButton,
        block: true,
        loading: state.isPending,
        disabled: !state.canSubmitReset,
        iconTrailing: IconName.arrowRight,
        onPressed: cubit.submitReset,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(
            eyebrow: t.newPasswordEyebrow,
            title: t.newPasswordTitle,
            subtitle: t.newPasswordSubtitle,
          ),
          const SizedBox(height: AppSpacing.s6),
          if (error != null) ...[
            AppBanner(
              key: const ValueKey('forgotResetErrorBanner'),
              variant: AppFeedbackVariant.error,
              body: _errorTextFor(context, error),
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          AppPasswordField(
            key: const ValueKey('forgotNewPasswordField'),
            label: t.newPasswordLabel,
            value: state.newPassword,
            onChanged: cubit.setNewPassword,
            autoComplete: AppPasswordAutoComplete.newPassword,
            withMeter: true,
            required: true,
          ),
          const SizedBox(height: AppSpacing.s4),
          AppPasswordField(
            key: const ValueKey('forgotConfirmPasswordField'),
            label: t.confirmPasswordLabel,
            value: state.confirmPassword,
            onChanged: cubit.setConfirmPassword,
            autoComplete: AppPasswordAutoComplete.newPassword,
            required: true,
          ),
        ],
      ),
    );
  }
}

class _BackToSignIn extends StatelessWidget {
  const _BackToSignIn({required this.text, required this.label});

  final String text;
  final String label;

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
          key: const ValueKey('forgotBackToSignIn'),
          label: label,
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    );
  }
}

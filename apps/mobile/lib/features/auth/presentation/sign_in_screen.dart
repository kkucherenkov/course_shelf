import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_in_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/sign_in_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:app_mobile/features/auth/presentation/widgets/sso_providers.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// Sign-in: email + password. Mirrors `apps/web` sign-in, and is the root of
/// the unauthenticated stack (`cs-mobile-auth` renders it with `back={false}`).
///
/// Reads the app-level [AuthCubit] provided above the `Navigator` in `App`
/// rather than creating its own — a private instance would authenticate a
/// session [AuthGate] cannot see. [SignInCubit] wraps it with the form state.
class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SignInCubit>(
      // AuthCubit comes from `context.read`, NOT from get_it: it is registered
      // as a factory, so resolving it here would mint a second session and the
      // gate would keep watching the first.
      create: (_) => SignInCubit(
        authCubit: context.read<AuthCubit>(),
        instanceRepository: getIt(),
      )..start(),
      child: const _SignInView(),
    );
  }
}

class _SignInView extends StatelessWidget {
  const _SignInView();

  /// Web formats the retry countdown as m:ss over a minute, else "{n}s".
  String _formatRetry(int seconds) {
    if (seconds >= 60) {
      final m = seconds ~/ 60;
      final s = seconds % 60;
      return '$m:${s.toString().padLeft(2, '0')}';
    }
    return '${seconds}s';
  }

  String? _errorText(BuildContext context, SignInError error) {
    final t = context.t.auth.signIn;
    return switch (error) {
      SignInError.emailInvalid => t.errorEmailInvalid,
      SignInError.passwordTooShort => t.errorPasswordTooShort,
      SignInError.invalidCredentials => t.errorInvalidCredentials,
      SignInError.generic => t.errorInvalidCredentials,
    };
  }

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signIn;
    final theme = Theme.of(context);

    return BlocBuilder<SignInCubit, SignInState>(
      builder: (context, state) {
        final cubit = context.read<SignInCubit>();
        final error = state.errorMessage;

        return AuthScaffold(
          // Root of the unauthenticated stack — nowhere to go back to.
          showBack: false,
          action: AppButton(
            key: const ValueKey('signInSubmit'),
            label: t.submit,
            block: true,
            loading: state.isPending,
            // Web disables this while `!formValid`; mobile keeps it live and
            // validates on submit — see SignInCubit for why.
            disabled: state.isRateLimited,
            iconTrailing: IconName.arrowRight,
            onPressed: cubit.submit,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                t.eyebrow,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: AppSpacing.s3),
              Text(
                t.title,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppSpacing.s2),
              Text(
                t.subtitle,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.s6),

              // Rate-limit wins over the generic error banner, as on web.
              if (state.isRateLimited) ...[
                AppBanner(
                  key: const ValueKey('signInRateLimitBanner'),
                  variant: AppFeedbackVariant.warning,
                  body: t.errorRateLimit(
                    time: _formatRetry(state.rateLimitSeconds ?? 0),
                  ),
                ),
                const SizedBox(height: AppSpacing.s4),
              ] else if (error != null) ...[
                AppBanner(
                  key: const ValueKey('signInErrorBanner'),
                  variant: AppFeedbackVariant.error,
                  body: _errorText(context, error),
                ),
                const SizedBox(height: AppSpacing.s4),
              ],

              AppTextField(
                key: const ValueKey('signInEmailField'),
                label: t.emailLabel,
                value: state.email,
                onChanged: cubit.setEmail,
                type: AppTextFieldType.email,
                placeholder: t.emailHint,
                required: true,
              ),
              const SizedBox(height: AppSpacing.s4),
              AppPasswordField(
                key: const ValueKey('signInPasswordField'),
                label: t.passwordLabel,
                value: state.password,
                onChanged: cubit.setPassword,
                placeholder: t.passwordHint,
                required: true,
              ),
              const SizedBox(height: AppSpacing.s4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: AppCheckbox(
                      key: const ValueKey('signInKeepSignedIn'),
                      value: state.keepSignedIn,
                      label: t.keepSignedIn,
                      onChanged: cubit.setKeepSignedIn,
                    ),
                  ),
                  AppButton(
                    key: const ValueKey('signInForgotLink'),
                    label: t.forgotLink,
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.sm,
                    onPressed: () =>
                        Navigator.pushNamed(context, AppRoutes.forgot),
                  ),
                ],
              ),

              // v1 ships `ssoProviders: []`, so this normally does not render.
              if (state.config.ssoProviders.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s5),
                _Divider(label: context.t.auth.dividerOr),
                const SizedBox(height: AppSpacing.s4),
                AppSsoBlock(
                  key: const ValueKey('signInSsoBlock'),
                  providers: ssoProvidersFor(
                    context,
                    state.config.ssoProviders,
                  ),
                ),
              ],

              // Hidden when the instance has self-registration off.
              if (state.config.selfRegistration) ...[
                const SizedBox(height: AppSpacing.s5),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        t.noAccount,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    AppButton(
                      key: const ValueKey('signInSignUpLink'),
                      label: t.signUpLink,
                      variant: AppButtonVariant.ghost,
                      size: AppButtonSize.sm,
                      onPressed: () =>
                          Navigator.pushNamed(context, AppRoutes.signUp),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: AppSpacing.s4),
              Text(
                t.legalFootnote,
                textAlign: TextAlign.center,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// "or" rule between the password form and the SSO block.
class _Divider extends StatelessWidget {
  const _Divider({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s3),
          child: Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}

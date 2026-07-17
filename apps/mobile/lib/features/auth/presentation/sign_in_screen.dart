import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_banners.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Sign-in: email + password. Mirrors `apps/web` sign-in, and is the root of
/// the unauthenticated stack (`cs-mobile-auth` renders it with `back={false}`).
/// The final visual design lands in E18-F03-S01.
///
/// Reads the app-level [AuthCubit] provided above the `Navigator` in `App`
/// rather than creating its own — a private instance would authenticate a
/// session [AuthGate] cannot see.
class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) => const _EmailSignInView();
}

class _EmailSignInView extends StatefulWidget {
  const _EmailSignInView();

  @override
  State<_EmailSignInView> createState() => _EmailSignInViewState();
}

class _EmailSignInViewState extends State<_EmailSignInView> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  /// Client-side validation message; takes precedence over the cubit's
  /// server-side error until the next submit.
  String? _localError;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // Mirrors the web sign-in validation (email contains '@' & ≥5 chars;
  // password ≥8) so the two platforms reject the same inputs.
  bool _emailValid(String email) => email.contains('@') && email.length >= 5;
  bool _passwordValid(String password) => password.length >= 8;

  void _submit() {
    final t = context.t.auth.signIn;
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;

    if (!_emailValid(email)) {
      setState(() => _localError = t.errorEmailInvalid);
      return;
    }
    if (!_passwordValid(password)) {
      setState(() => _localError = t.errorPasswordTooShort);
      return;
    }
    setState(() => _localError = null);
    context.read<AuthCubit>().signIn(email: email, password: password);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signIn;
    final theme = Theme.of(context);

    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          // AuthGate rebuilds to the home stack; drop the pushed auth routes.
          Navigator.popUntil(context, (route) => route.isFirst);
        }
      },
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          final isLoading = state.status == AuthStatus.authenticating;
          // Local validation wins; otherwise surface a server-side failure.
          final error = _localError ??
              (state.status == AuthStatus.error
                  ? t.errorInvalidCredentials
                  : null);

          return Scaffold(
            appBar: AppBar(),
            body: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      t.title,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (error != null) ...[
                      AuthErrorBanner(message: error),
                      const SizedBox(height: 16),
                    ],
                    TextField(
                      key: const ValueKey('signInEmailField'),
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      autocorrect: false,
                      decoration: InputDecoration(
                        labelText: t.emailLabel,
                        hintText: t.emailHint,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      key: const ValueKey('signInPasswordField'),
                      controller: _passwordCtrl,
                      obscureText: _obscure,
                      autofillHints: const [AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: t.passwordLabel,
                        hintText: t.passwordHint,
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    FilledButton(
                      key: const ValueKey('signInSubmit'),
                      onPressed: isLoading ? null : _submit,
                      child: isLoading
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(t.submit),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(t.noAccount),
                        TextButton(
                          key: const ValueKey('signInSignUpLink'),
                          onPressed: isLoading
                              ? null
                              : () => Navigator.pushNamed(
                                    context,
                                    AppRoutes.signUp,
                                  ),
                          child: Text(t.signUpLink),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

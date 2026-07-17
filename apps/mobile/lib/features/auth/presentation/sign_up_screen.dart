import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_banners.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Email + password registration. Reached from the "no account? sign up" link
/// on [SignInScreen]. Final visual design: E18-F03-S01.
///
/// Reads the app-level [AuthCubit] (provided above the `Navigator` in `App`)
/// — see [SignInScreen] for why a pushed route must not own its own instance.
class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) => const _EmailSignUpView();
}

class _EmailSignUpView extends StatefulWidget {
  const _EmailSignUpView();

  @override
  State<_EmailSignUpView> createState() => _EmailSignUpViewState();
}

class _EmailSignUpViewState extends State<_EmailSignUpView> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  String? _localError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  bool _emailValid(String email) => email.contains('@') && email.length >= 5;
  bool _passwordValid(String password) => password.length >= 8;

  void _submit() {
    final t = context.t.auth.signUp;
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;

    if (name.isEmpty) {
      setState(() => _localError = t.errorNameRequired);
      return;
    }
    if (!_emailValid(email)) {
      setState(() => _localError = t.errorEmailInvalid);
      return;
    }
    if (!_passwordValid(password)) {
      setState(() => _localError = t.errorPasswordTooShort);
      return;
    }
    setState(() => _localError = null);
    context
        .read<AuthCubit>()
        .signUp(name: name, email: email, password: password);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth.signUp;
    final theme = Theme.of(context);

    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          Navigator.popUntil(context, (route) => route.isFirst);
        }
      },
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          final isLoading = state.status == AuthStatus.authenticating;
          // Registration failures are overwhelmingly a taken email at this
          // stage; the richer error mapping lands with the E18 redesign.
          final error = _localError ??
              (state.status == AuthStatus.error ? t.errorEmailTaken : null);

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
                      key: const ValueKey('signUpNameField'),
                      controller: _nameCtrl,
                      autofillHints: const [AutofillHints.name],
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        labelText: t.nameLabel,
                        hintText: t.nameHint,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      key: const ValueKey('signUpEmailField'),
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
                      key: const ValueKey('signUpPasswordField'),
                      controller: _passwordCtrl,
                      obscureText: _obscure,
                      autofillHints: const [AutofillHints.newPassword],
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
                      key: const ValueKey('signUpSubmit'),
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
                        Text(t.hasAccount),
                        TextButton(
                          key: const ValueKey('signUpSignInLink'),
                          onPressed:
                              isLoading ? null : () => Navigator.pop(context),
                          child: Text(t.signInLink),
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

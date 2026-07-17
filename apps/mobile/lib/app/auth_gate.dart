import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/main_shell.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Root gate: watches the app-level [AuthCubit] (provided above the
/// `MaterialApp` in `App`, which also kicks off the session check) and swaps
/// between the unauthenticated stack and the authenticated shell.
///
/// Sign-in is the root of the unauthenticated stack — `cs-mobile-auth` renders
/// it with `back={false}`, E18-F03-S01 lists exactly three auth screens
/// (sign_in, sign_up, forgot), and `apps/web` has no welcome page either.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.unknown:
            return const _SplashScreen();
          case AuthStatus.unauthenticated:
          case AuthStatus.error:
          // `authenticating` keeps the auth screen mounted on purpose — it
          // owns the in-flight affordance (a spinner on its submit button).
          // Swapping in a splash here would tear the form down mid-submit.
          case AuthStatus.authenticating:
            return const SignInScreen();
          case AuthStatus.authenticated:
            return const MainShell();
        }
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          context.t.common.appTitle,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}

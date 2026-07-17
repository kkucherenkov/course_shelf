import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/main_shell.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/bloc/first_run_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

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
            return const _UnauthenticatedStack();
          case AuthStatus.authenticated:
            return const MainShell();
        }
      },
    );
  }
}

/// The unauthenticated stack's root.
///
/// Normally sign-in — but on a server with no users at all, the first-run
/// wizard takes its place (card: "if no users, route to sign-up"; web does the
/// same via `useFirstRun`). Sign-up is the *root* here, not a pushed route, so
/// it renders without a back affordance: there is nothing behind it.
///
/// Only an explicit `false` reroutes. While the probe is in flight
/// ([FirstRunCubit] state `null`) sign-in stays up, so a returning user never
/// sees the wizard flash past.
class _UnauthenticatedStack extends StatelessWidget {
  const _UnauthenticatedStack();

  @override
  Widget build(BuildContext context) {
    return BlocProvider<FirstRunCubit>(
      create: (_) => FirstRunCubit(getIt())..check(),
      child: BlocBuilder<FirstRunCubit, bool?>(
        builder: (context, hasUsers) => hasUsers == false
            ? const SignUpScreen(showBack: false)
            : const SignInScreen(),
      ),
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

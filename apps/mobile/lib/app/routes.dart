import 'package:flutter/material.dart';

import 'package:app_mobile/features/auth/presentation/phone_auth_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/features/auth/presentation/welcome_screen.dart';
import 'package:app_mobile/features/settings/presentation/settings_screen.dart';

/// Named route constants.
abstract class AppRoutes {
  static const welcome = '/';
  static const signIn = '/sign-in';
  static const phoneAuth = '/sign-in/phone';
  static const signUp = '/sign-up';
  static const settings = '/settings';
}

/// Route factory — maps route names to screen widgets.
Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  final name = settings.name;

  if (name == AppRoutes.welcome) {
    return MaterialPageRoute<void>(
      builder: (_) => const WelcomeScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.signIn) {
    return MaterialPageRoute<void>(
      builder: (_) => const SignInScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.phoneAuth) {
    return MaterialPageRoute<void>(
      builder: (_) => const PhoneAuthScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.signUp) {
    return MaterialPageRoute<void>(
      builder: (_) => const SignUpScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.settings) {
    return MaterialPageRoute<void>(
      builder: (_) => const SettingsScreen(),
      settings: settings,
    );
  }

  return null;
}

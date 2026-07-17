import 'package:flutter/material.dart';

import 'package:app_mobile/features/auth/presentation/forgot_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/auth/presentation/sign_up_screen.dart';
import 'package:app_mobile/features/course_detail/presentation/course_detail_screen.dart';
import 'package:app_mobile/features/player/presentation/lesson_player_screen.dart';

/// Named route constants.
///
/// There is no `/` entry: `AuthGate` is the `MaterialApp`'s `home`, and it —
/// not a route — decides between the unauthenticated stack ([signIn] and the
/// routes pushed from it) and the authenticated `MainShell`. The five tabs are
/// likewise not routes; the shell swaps them through an `IndexedStack`.
///
/// [forgot] and [lesson] are registered ahead of the cards that implement them
/// (E18-F03-S01 and E18-F02-S01) and currently point at placeholder screens.
/// That is deliberate: those cards run in parallel, and pre-wiring the routes
/// means neither has to edit this file, so neither can collide in it.
abstract class AppRoutes {
  static const signIn = '/sign-in';
  static const signUp = '/sign-up';

  /// Password reset — E18-F03-S01.
  static const forgot = '/forgot';

  /// Lesson player — E18-F02-S01. Pass the lesson id as the route argument:
  /// `Navigator.pushNamed(context, AppRoutes.lesson, arguments: lessonId)`.
  static const lesson = '/lesson';

  /// Course detail — E18-F01-S03. Pass the course id as the route argument:
  /// `Navigator.pushNamed(context, AppRoutes.course, arguments: courseId)`.
  static const course = '/course';
}

/// Route factory — maps route names to screen widgets.
Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  final name = settings.name;

  if (name == AppRoutes.signIn) {
    return MaterialPageRoute<void>(
      builder: (_) => const SignInScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.signUp) {
    return MaterialPageRoute<void>(
      builder: (_) => const SignUpScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.forgot) {
    return MaterialPageRoute<void>(
      builder: (_) => const ForgotScreen(),
      settings: settings,
    );
  }

  if (name == AppRoutes.lesson) {
    final lessonId = settings.arguments;
    if (lessonId is! String) {
      throw ArgumentError.value(
        settings.arguments,
        'arguments',
        '${AppRoutes.lesson} requires the lesson id as a String argument',
      );
    }
    return MaterialPageRoute<void>(
      builder: (_) => LessonPlayerScreen(lessonId: lessonId),
      settings: settings,
    );
  }

  if (name == AppRoutes.course) {
    final courseId = settings.arguments;
    if (courseId is! String) {
      throw ArgumentError.value(
        settings.arguments,
        'arguments',
        '${AppRoutes.course} requires the course id as a String argument',
      );
    }
    return MaterialPageRoute<void>(
      builder: (_) => CourseDetailScreen(courseId: courseId),
      settings: settings,
    );
  }

  return null;
}

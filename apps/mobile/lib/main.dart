import 'package:app_ui/app_ui.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:app_mobile/app/auth_gate.dart';
import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';
import 'package:app_mobile/shared/notifications/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  LocaleSettings.useDeviceLocale();

  await bootstrapFirebase();

  configureDependencies();

  const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
        options.tracesSampleRate = 0.2;
      },
      appRunner: () => runApp(
        TranslationProvider(child: const App()),
      ),
    );
  } else {
    runApp(TranslationProvider(child: const App()));
  }
}

/// Initialise Firebase (and its push background handler) if configuration is
/// present, degrading to "push disabled" otherwise.
///
/// Firebase needs `google-services.json` (Android) / `GoogleService-Info.plist`
/// (iOS) — run `flutterfire configure` to generate `firebase_options.dart`.
/// When that config is absent (local dev without secrets, #177) or the plugin
/// is unavailable (widget tests), `initializeApp` throws. Boot must survive
/// that: the app runs fine without push, and crashing the whole process on
/// missing optional config is the wrong trade. Prod ships real config, so this
/// catch never fires there.
Future<void> bootstrapFirebase() async {
  try {
    await Firebase.initializeApp();
    await PushNotificationService.registerBackgroundHandler();
  } catch (error) {
    debugPrint('Firebase unavailable — push notifications disabled: $error');
  }
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    // The session cubit is provided ABOVE the MaterialApp on purpose: pushed
    // routes are children of the MaterialApp's Navigator, not of `home:`, so a
    // provider inside AuthGate would be invisible to /sign-up. One instance
    // above the Navigator is what makes "sign in on any auth route → the gate
    // rebuilds into the shell" work at all.
    return BlocProvider<AuthCubit>(
      create: (_) => getIt<AuthCubit>()..checkSession(),
      child: MaterialApp(
        onGenerateTitle: (context) => context.t.common.appTitle,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        locale: TranslationProvider.of(context).flutterLocale,
        supportedLocales: AppLocaleUtils.supportedLocales,
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        // AuthGate is the home for the session-restore-on-boot flow.
        home: const AuthGate(),
        onGenerateRoute: onGenerateRoute,
      ),
    );
  }
}

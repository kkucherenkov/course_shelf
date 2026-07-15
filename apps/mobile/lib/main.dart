import 'package:app_ui/app_ui.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:app_mobile/app/auth_gate.dart';
import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';
import 'package:app_mobile/shared/notifications/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  LocaleSettings.useDeviceLocale();

  // Firebase — requires google-services.json (Android) / GoogleService-Info.plist (iOS).
  // Run `flutterfire configure` to generate firebase_options.dart.
  await Firebase.initializeApp();
  await PushNotificationService.registerBackgroundHandler();

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

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
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
    );
  }
}

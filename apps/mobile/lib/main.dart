import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:workmanager/workmanager.dart';

import 'package:app_mobile/app/auth_gate.dart';
import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/app/theme_preferences.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/downloads/data/platform_download_scheduler.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/shared/di/injector.dart';
import 'package:app_mobile/shared/notifications/push_notification_service.dart';

/// Background entry point. Runs in its own isolate with no access to the
/// running app's `get_it` graph, so it builds exactly what it needs and asks
/// the queue to resume. Whatever window the OS grants is what it gets.
@pragma('vm:entry-point')
void downloadsCallbackDispatcher() {
  Workmanager().executeTask((String task, Map<String, dynamic>? input) async {
    if (task != kDownloadResumeTask) return true;
    configureDependencies();
    final DownloadsRepository downloads = getIt<DownloadsRepository>();
    await downloads.reconcileAfterRestart();
    // Awaited, and this is the whole point of the callback: reconcile only
    // relabels the stranded rows and kicks the fire-and-forget pump. Returning
    // here would report completion to the OS while the transfer it just
    // started is still in flight, and the background execution session would
    // be torn down under it.
    await downloads.drain();
    return true;
  });
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  LocaleSettings.useDeviceLocale();

  await bootstrapFirebase();

  configureDependencies();

  // Resume-on-launch: an app kill leaves rows in `downloading`;
  // reconcileAfterRestart re-queues them and kicks the pump. Deliberately not
  // awaited — startup must not wait on the download queue.
  unawaited(getIt<DownloadsRepository>().reconcileAfterRestart());

  await bootstrapPreferences();

  // Opportunistic only — foreground download plus resume-on-launch is what
  // guarantees completion. A platform that refuses to register background work
  // (an OS denial, a missing plugin, a desktop host) must not prevent the app
  // from starting, so this failure is logged and swallowed like Firebase's.
  try {
    await Workmanager().initialize(downloadsCallbackDispatcher);
  } catch (error) {
    debugPrint(
      'Workmanager init failed; background resume unavailable: $error',
    );
  }

  const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init((options) {
      options.dsn = sentryDsn;
      options.tracesSampleRate = 0.2;
    }, appRunner: () => runApp(TranslationProvider(child: const App())));
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
    // AuthCubit, SettingsCubit and DownloadsBloc are provided ABOVE the
    // MaterialApp on purpose: pushed routes are children of the MaterialApp's
    // Navigator, not of `home:`, so a provider inside AuthGate would be
    // invisible to /sign-up — and the SettingsCubit that drives themeMode /
    // text scale must be the same instance the Settings tab mutates.
    //
    // DownloadsBloc is here for the same reason plus one of its own: the
    // Downloads tab and the pushed course-detail route must read the *same*
    // queue. A provider per screen would give each its own subscription, and a
    // lesson downloaded from course detail would not appear in the tab until
    // it was rebuilt.
    return MultiBlocProvider(
      providers: <BlocProvider<dynamic>>[
        BlocProvider<AuthCubit>(
          create: (_) => getIt<AuthCubit>()..checkSession(),
        ),
        BlocProvider<SettingsCubit>(create: (_) => getIt<SettingsCubit>()),
        BlocProvider<DownloadsBloc>(
          create: (_) => getIt<DownloadsBloc>()..add(const DownloadsStarted()),
        ),
      ],
      child: BlocBuilder<SettingsCubit, SettingsState>(
        builder: (context, settings) => MaterialApp(
          onGenerateTitle: (context) => context.t.common.appTitle,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: themeModeFrom(settings.theme),
          locale: TranslationProvider.of(context).flutterLocale,
          supportedLocales: AppLocaleUtils.supportedLocales,
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          // Wraps the Navigator, so text scale + reduce-motion reach pushed
          // routes (player, course detail) too — not just `home:`.
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(textScaleFrom(settings.textSize)),
              disableAnimations: settings.reduceMotion,
            ),
            child: child!,
          ),
          // AuthGate is the home for the session-restore-on-boot flow.
          home: const AuthGate(),
          onGenerateRoute: onGenerateRoute,
        ),
      ),
    );
  }
}

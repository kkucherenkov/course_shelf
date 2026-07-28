import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

Widget _harness() => TranslationProvider(child: const App());

void main() {
  setUp(() async {
    await resetInjector();

    final auth = _MockAuthRepository();
    when(
      () => auth.getSession(),
    ).thenAnswer((_) async => null); // stay on sign-in

    final instance = _MockInstanceRepository();
    when(
      () => instance.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instance.hasUsers()).thenAnswer((_) async => true);

    SharedPreferences.setMockInitialValues(<String, Object>{
      'pref.theme': 'dark',
      'pref.textSize': 'large',
      'pref.reduceMotion': true,
    });
    final prefs = await SharedPreferences.getInstance();

    getIt
      ..registerSingleton<SharedPreferences>(prefs)
      ..registerLazySingleton<SettingsPreferencesStore>(
        () => SettingsPreferencesStore(getIt<SharedPreferences>()),
      )
      ..registerFactory<AuthCubit>(() => AuthCubit(auth))
      ..registerLazySingleton<InstanceRepository>(() => instance)
      ..registerFactory<SettingsCubit>(
        () => SettingsCubit(getIt<SettingsPreferencesStore>()),
      );
  });

  tearDown(resetInjector);

  testWidgets('App honours persisted theme, text scale, and reduce-motion', (
    tester,
  ) async {
    await tester.pumpWidget(_harness());
    await tester.pumpAndSettle();

    // Lands on sign-in (unauthenticated), and the MaterialApp reflects the
    // persisted dark theme.
    expect(find.byType(SignInScreen), findsOneWidget);
    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).themeMode,
      ThemeMode.dark,
    );

    // The builder's MediaQuery override reaches the route: large = 1.2x,
    // reduce-motion true.
    final ctx = tester.element(find.byType(SignInScreen));
    expect(MediaQuery.textScalerOf(ctx).scale(10), 12); // 10 * 1.2
    expect(MediaQuery.of(ctx).disableAnimations, isTrue);
  });
}

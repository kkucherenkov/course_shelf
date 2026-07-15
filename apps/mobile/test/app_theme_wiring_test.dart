import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_ui/app_ui.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late _MockAuthRepository repository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    // AuthGate calls checkSession() on build; null keeps it on the
    // unauthenticated branch and off the network.
    when(() => repository.getSession()).thenAnswer((_) async => null);
    getIt.registerFactory<AuthCubit>(() => AuthCubit(repository));
  });

  tearDown(resetInjector);

  testWidgets('App wires AppTheme, not a placeholder', (tester) async {
    await tester.pumpWidget(TranslationProvider(child: const App()));

    // Read the MaterialApp that App actually built.
    final MaterialApp app = tester.widget<MaterialApp>(
      find.byType(MaterialApp),
    );

    expect(app.theme?.colorScheme.primary, AppColorsLight.brandAccent);
    expect(app.darkTheme?.colorScheme.primary, AppColorsDark.brandAccent);
    expect(app.themeMode, ThemeMode.system);
  });
}

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/forgot_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late _MockAuthRepository repository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();
    getIt.registerLazySingleton<AuthRepository>(() => repository);
  });

  tearDown(resetInjector);

  Widget harness({String resetToken = ''}) => TranslationProvider(
    child: MaterialApp(
      theme: AppTheme.light(),
      home: ForgotScreen(resetToken: resetToken),
    ),
  );

  testWidgets('opens on the email step when no token is supplied', (
    tester,
  ) async {
    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('forgotEmailField')), findsOneWidget);
    expect(find.byKey(const ValueKey('forgotSendSubmit')), findsOneWidget);
    expect(find.byKey(const ValueKey('forgotNewPasswordField')), findsNothing);
  });

  testWidgets('a deep-link token opens straight on the reset step', (
    tester,
  ) async {
    await tester.pumpWidget(harness(resetToken: 'tok-abc'));
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey('forgotNewPasswordField')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('forgotConfirmPasswordField')),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('forgotEmailField')), findsNothing);
  });

  testWidgets('sending a reset link advances to the sent confirmation', (
    tester,
  ) async {
    when(
      () => repository.requestPasswordReset(email: any(named: 'email')),
    ).thenAnswer((_) async {});

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('forgotEmailField')),
      'user@example.com',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('forgotSendSubmit')));
    await tester.pumpAndSettle();

    // The Sent step's only affordance is the way back to sign-in.
    expect(
      find.byKey(const ValueKey('forgotSentBackToSignIn')),
      findsOneWidget,
    );
    verify(
      () => repository.requestPasswordReset(email: 'user@example.com'),
    ).called(1);
  });

  testWidgets('the send button is a real, activatable control', (tester) async {
    // tester.tap ignores the semantics layer; assert the button reports an
    // enabled tap action to assistive tech, per the brief's a11y trap.
    when(
      () => repository.requestPasswordReset(email: any(named: 'email')),
    ).thenAnswer((_) async {});

    await tester.pumpWidget(harness());
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('forgotEmailField')),
      'user@example.com',
    );
    await tester.pumpAndSettle();

    // Target the node by its accessible name, not the AppButton key: the key
    // is on the wrapper, whose own node merges to the route root — the button
    // role + tap action live on the inner control that owns the label.
    expect(
      tester.getSemantics(find.bySemanticsLabel('Send reset link')),
      isSemantics(isButton: true, hasTapAction: true, isEnabled: true),
    );
  });
}

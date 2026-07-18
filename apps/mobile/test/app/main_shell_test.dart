import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/main_shell.dart';
import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/browse/presentation/browse_screen.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/settings_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

/// SignInScreen resolves this from the injector to decide whether to show the
/// SSO row and the sign-up CTA (E18-F03-S01).
class _MockInstanceRepository extends Mock implements InstanceRepository {}

/// The shell mounts Home's cubit on an authenticated session (E18-F01-S01),
/// so the real `App` pulls a HomeRepository out of the injector too.
class _MockHomeRepository extends Mock implements HomeRepository {}

/// The 5-tab `IndexedStack` mounts every body up front, Search included, so
/// `SearchCubit` (and therefore `SearchRepository`) must be registered even
/// though these tests never visit the Search tab.
class _MockSearchRepository extends Mock implements SearchRepository {}

/// `BrowseCubit` (and therefore `BrowseRepository`) must be registered for
/// the same reason — plus the "tapping a tab switches the body" case below
/// actually visits Browse and calls `BrowseCubit.load()` on mount.
class _MockBrowseRepository extends Mock implements BrowseRepository {}

class _FakeBrowseFilter extends Fake implements BrowseFilter {}

const _user = AuthUser(id: 'u1', email: 'user@example.com', name: 'User');

const _emptyHome = HomeSummary(
  continueWatching: <ContinueWatchingCourse>[],
  recentlyAdded: <RecentlyAddedCourse>[],
  libraryCount: 0,
);

/// Pumps the real composition root — `App` resolves its own [AuthCubit] from
/// the injector, so this exercises the same wiring `main()` ships rather than
/// a test-local re-assembly of it.
Widget _harness() => TranslationProvider(child: const App());

/// The bottom-tab bar carries a stable key precisely because a tab's label
/// also renders as the app bar's large title when that tab is active — an
/// unscoped `find.text('Home')` is ambiguous.
Finder _tab(String label) => find.descendant(
  of: find.byKey(const ValueKey<String>('appNavigationShellBottomBar')),
  matching: find.text(label),
);

void main() {
  setUpAll(() => registerFallbackValue(_FakeBrowseFilter()));

  late _MockAuthRepository repository;
  late _MockInstanceRepository instanceRepository;
  late _MockHomeRepository homeRepository;

  setUp(() async {
    await resetInjector();
    repository = _MockAuthRepository();

    // Sign-in resolves the instance config (SSO row + sign-up CTA) and the
    // first-user check from the injector (E18-F03-S01).
    instanceRepository = _MockInstanceRepository();
    when(
      () => instanceRepository.getInstanceConfig(),
    ).thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instanceRepository.hasUsers()).thenAnswer((_) async => true);

    // The shell provides Home's cubit and kicks off a load the moment an
    // authenticated session mounts it. A fast, empty-summary repository lets
    // that load — and the pull-to-refresh seam below — resolve immediately.
    homeRepository = _MockHomeRepository();
    when(homeRepository.fetchSummary).thenAnswer((_) async => _emptyHome);

    // Fast, empty catalog for the Browse tab's own load-on-mount.
    final browseRepository = _MockBrowseRepository();
    when(
      () => browseRepository.fetchCourses(any()),
    ).thenAnswer((_) async => <BrowseCourse>[]);
    when(
      browseRepository.fetchLibraries,
    ).thenAnswer((_) async => <BrowseLibrary>[]);

    getIt
      ..registerFactory<AuthCubit>(() => AuthCubit(repository))
      ..registerLazySingleton<InstanceRepository>(() => instanceRepository)
      ..registerFactory<HomeCubit>(() => HomeCubit(homeRepository))
      ..registerFactory<SearchCubit>(() => SearchCubit(_MockSearchRepository()))
      ..registerFactory<BrowseCubit>(() => BrowseCubit(browseRepository))
      ..registerFactory<SettingsCubit>(SettingsCubit.new);
  });

  tearDown(resetInjector);

  group('unauthenticated', () {
    setUp(() {
      when(() => repository.getSession()).thenAnswer((_) async => null);
    });

    testWidgets('the gate opens on sign-in, not a welcome screen', (
      tester,
    ) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      expect(find.byType(SignInScreen), findsOneWidget);
      expect(find.byType(MainShell), findsNothing);
    });

    testWidgets('signing in reaches the 5-tab bar', (tester) async {
      when(
        () => repository.signIn(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) async => _user);

      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const ValueKey('signInEmailField')),
        'user@example.com',
      );
      await tester.enterText(
        find.byKey(const ValueKey('signInPasswordField')),
        'password123',
      );
      await tester.tap(find.byKey(const ValueKey('signInSubmit')));
      await tester.pumpAndSettle();

      expect(find.byType(MainShell), findsOneWidget);
      for (final label in <String>[
        'Home',
        'Browse',
        'Downloads',
        'Search',
        'Settings',
      ]) {
        expect(_tab(label), findsOneWidget, reason: 'missing tab: $label');
      }
    });
  });

  group('authenticated', () {
    setUp(() {
      when(() => repository.getSession()).thenAnswer((_) async => _user);
    });

    testWidgets('a restored session lands on the shell, Home first', (
      tester,
    ) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      expect(find.byType(MainShell), findsOneWidget);
      expect(
        tester
            .widget<AppNavigationShell>(find.byType(AppNavigationShell))
            .currentIndex,
        0,
      );
    });

    testWidgets('tapping a tab switches the body', (tester) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      expect(find.byType(BrowseTabBody), findsNothing);

      await tester.tap(_tab('Browse'));
      await tester.pumpAndSettle();

      final shell = tester.widget<AppNavigationShell>(
        find.byType(AppNavigationShell),
      );
      expect(shell.currentIndex, 1);
      expect(find.byType(BrowseTabBody), findsOneWidget);
    });

    testWidgets('the Settings tab renders without a doubled app bar', (
      tester,
    ) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      await tester.tap(_tab('Settings'));
      await tester.pumpAndSettle();

      expect(find.byType(SettingsTabBody), findsOneWidget);
      // The shell supplies the one and only Scaffold, and exactly one app bar
      // with it — on Android `SliverAppBar.large` builds an inner `AppBar`, so
      // one is the floor, not zero. A tab body carrying its own Scaffold/AppBar
      // (as SettingsScreen used to) would double both counts.
      expect(find.byType(Scaffold), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('signing out of Settings returns to sign-in', (tester) async {
      when(() => repository.signOut()).thenAnswer((_) async {});

      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      await tester.tap(_tab('Settings'));
      await tester.pumpAndSettle();

      // The restructured Settings body (Profile/Appearance/Playback/Account
      // sections above it) pushes the pinned Sign-out row below the default
      // test viewport — scroll the shell's own CustomScrollView to reach it.
      await tester.ensureVisible(find.byKey(const ValueKey('settingsSignOut')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('settingsSignOut')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('settingsSignOutConfirm')));
      await tester.pumpAndSettle();

      verify(() => repository.signOut()).called(1);
      // No imperative navigation: the gate watches the same cubit Settings
      // signed out of, so it rebuilds into the unauthenticated stack itself.
      expect(find.byType(SignInScreen), findsOneWidget);
      expect(find.byType(MainShell), findsNothing);
    });

    testWidgets('only Home carries a refresh affordance', (tester) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      final tabs = tester
          .widget<AppNavigationShell>(find.byType(AppNavigationShell))
          .tabs;
      expect(tabs.length, 5);
      expect(tabs[0].onRefresh, isNotNull);
      for (var i = 1; i < tabs.length; i++) {
        expect(tabs[i].onRefresh, isNull, reason: 'tab $i must not refresh');
      }
    });

    testWidgets('pulling down on Home runs the refresh seam end to end', (
      tester,
    ) async {
      await tester.pumpWidget(_harness());
      await tester.pumpAndSettle();

      // The shell owns the scrollable, so the RefreshIndicator can only exist
      // if `AppNavigationTab.onRefresh` was actually threaded through it.
      expect(find.byType(RefreshIndicator), findsOneWidget);

      await tester.fling(
        find.byType(CustomScrollView),
        const Offset(0, 400),
        1000,
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // The gesture armed the indicator: proof the drag reached the shell's
      // scrollable and it called back into MainShell.
      expect(find.byType(RefreshProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();

      // ...and the future MainShell returned resolved, retiring the spinner.
      // A seam that never completed would leave it up and hang pumpAndSettle.
      expect(find.byType(RefreshProgressIndicator), findsNothing);
    });
  });
}

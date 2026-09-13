# CourseShelf — mobile (`app_mobile`)

Flutter client. Feature-first layering (`domain` / `data` / `presentation`),
`flutter_bloc` for state, `get_it` for DI, `dio` in `shared/network`.

- **Application id / bundle id:** `dev.courseshelf.app` (Android `applicationId`
  and iOS `PRODUCT_BUNDLE_IDENTIFIER`; Android `namespace` matches).
- **Display name:** CourseShelf (Android `android:label`, iOS `CFBundleDisplayName`).
- **Platforms scaffolded:** `android`, `ios`, `web`.

## Prerequisites before first run

Codegen output is git-ignored, so generate it after a fresh clone:

```sh
flutter pub get
dart run slang                                  # i18n → lib/i18n/strings.g.dart
dart run build_runner build --delete-conflicting-outputs   # freezed / drift / json
```

## Firebase (required to boot)

`lib/main.dart` calls `Firebase.initializeApp()` unconditionally, so the app
**cannot launch without Firebase config**. `flutter create` does not and cannot
generate these — they are per-project secrets you must obtain from the Firebase
console and drop in by hand:

| Platform | File                       | Location                              |
| -------- | -------------------------- | ------------------------------------- |
| Android  | `google-services.json`     | `android/app/google-services.json`    |
| iOS      | `GoogleService-Info.plist` | `ios/Runner/GoogleService-Info.plist` |

The Android file additionally needs the Google Services Gradle plugin wired
(`com.google.gms.google-services`) and `firebase_options.dart` generated via
`flutterfire configure`. Until that config is present, a debug build still
**compiles**, but the running app crashes at `Firebase.initializeApp()`.

These files are intentionally absent from version control.

## Running

```sh
flutter run                              # device / emulator (needs Firebase config)
flutter run -t widgetbook/main.dart      # component catalog — pnpm dev:widgetbook
```

The Widgetbook catalog (`widgetbook/main.dart`) does **not** touch Firebase, so
it launches on any surface (`-d chrome`, `-d linux`, an emulator) without the
Firebase config above — the fastest path for a visual pass.

## Pointing a build at a self-hosted instance

There is no runtime server setting. `AppConfig.fromEnv` reads the two base URLs
through `String.fromEnvironment`, so the host is fixed at compile time:

```sh
flutter build apk --debug \
  --dart-define=API_BASE_URL=http://192.168.1.10:8085/api/v1 \
  --dart-define=AUTH_BASE_URL=http://192.168.1.10:8085

flutter build apk --profile … # same flags, release-like performance
```

Plain HTTP works in **debug and profile builds only**:
`android/app/src/{debug,profile}/res/xml/network_security_config.xml` permit
cleartext for the whole variant, overriding the strict `src/main` config by
resource merging. A release APK still refuses cleartext to every host except
127.0.0.1, so a release build aimed at a plain-HTTP instance fails at the first
request — put TLS in front of the instance instead.

Those XML files deliberately do **not** quote the commands above: XML forbids a
double hyphen inside a comment, and every Flutter flag starts with one.

## Network video (video_player)

- Android: `INTERNET` permission is declared in the main manifest (release
  playback of remote streams needs it; debug/profile get it automatically).
- iOS: `NSAllowsLocalNetworking` is set so the plain-HTTP local-dev backend
  (`http://…:3000`) can stream during development. Production streams are HTTPS.

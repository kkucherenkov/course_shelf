import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for InstanceConfigDto
void main() {
  final instance = InstanceConfigDtoBuilder();
  // TODO add properties to the builder and call build()

  group(InstanceConfigDto, () {
    // When false, sign-up CTAs are hidden and /sign-up redirects to /sign-in.
    // bool selfRegistration
    test('to test the property `selfRegistration`', () async {
      // TODO
    });

    // When true, sign-up wizard renders the 6-digit-code step between account creation and library setup.
    // bool emailVerificationRequired
    test('to test the property `emailVerificationRequired`', () async {
      // TODO
    });

    // Configured OAuth / SSO providers. Empty array in v1 — Better Auth's `genericOAuth` plugin lands in v2.
    // BuiltList<SsoProviderConfig> ssoProviders
    test('to test the property `ssoProviders`', () async {
      // TODO
    });

  });
}

import 'package:dio/dio.dart';

import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';

/// Implements [InstanceRepository] against E14-F02-S01's `/admin/*` probes.
///
/// These two endpoints ARE in OpenAPI, so this should ride the generated
/// `app_api_client` (`AdminApi.getAdminInstance` / `.getAdminHasUsers`) rather
/// than hand-rolled Dio. It cannot today: `packages/api-client-dart` is not
/// importable. `pnpm spec:codegen` points `openapi-generator-cli -g dart-dio`
/// at `lib/generated`, and that generator emits a *whole package* at `-o` — so
/// the code lands at `lib/generated/lib/src/...` while the package's own
/// pubspec puts the lib root at `lib/`. Nothing resolves `package:app_api_client/…`.
///
/// Kept behind the port so the swap is this file only, once the codegen output
/// path is fixed. Verified against the real spec shapes (`InstanceConfigDto`,
/// `HasUsersResponse`), so the wire contract below is the generated one.
class InstanceApiImpl implements InstanceRepository {
  InstanceApiImpl({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Never throws — see [InstanceRepository.getInstanceConfig].
  @override
  Future<InstanceConfig> getInstanceConfig() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/admin/instance');
      final data = response.data;
      if (data == null) return InstanceConfig.defaults;
      return InstanceConfig(
        selfRegistration:
            (data['selfRegistration'] as bool?) ??
            InstanceConfig.defaults.selfRegistration,
        emailVerificationRequired:
            (data['emailVerificationRequired'] as bool?) ??
            InstanceConfig.defaults.emailVerificationRequired,
        ssoProviders:
            (data['ssoProviders'] as List<dynamic>?)?.cast<String>().toList() ??
            const <String>[],
      );
    } on Object {
      return InstanceConfig.defaults;
    }
  }

  /// Never throws, and fails closed to `true` — see
  /// [InstanceRepository.hasUsers].
  @override
  Future<bool> hasUsers() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/admin/has-users');
      return (response.data?['hasUsers'] as bool?) ?? true;
    } on Object {
      return true;
    }
  }
}

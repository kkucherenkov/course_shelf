import 'package:app_mobile/features/auth/domain/instance_config.dart';

/// Port — the instance/bootstrap probes the auth surfaces depend on.
/// Implementations live in `data/`.
///
/// Both endpoints are defined by E14-F02-S01 and consumed unchanged here.
abstract class InstanceRepository {
  /// `GET /api/v1/admin/instance`.
  ///
  /// Implementations must not throw: on any failure they resolve to
  /// [InstanceConfig.defaults], mirroring web's `useInstanceConfig`. A
  /// transient probe failure must not lock the user out of signing in.
  Future<InstanceConfig> getInstanceConfig();

  /// `GET /api/v1/admin/has-users` — false only on a genuinely empty install,
  /// which routes the user to the first-admin sign-up wizard.
  ///
  /// Implementations must not throw: on failure they resolve to `true`
  /// (assume users exist), mirroring web's `useFirstRun`. Guessing "empty" on a
  /// network blip would offer a stranger the first-admin bootstrap.
  Future<bool> hasUsers();
}

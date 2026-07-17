import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/instance_repository.dart';

/// Boot probe: does this server have any users yet?
///
/// Dart twin of web's `useFirstRun` composable, including its tri-state:
/// - `null`  — the probe has not resolved yet
/// - `false` — empty install; the next account bootstraps the first admin
/// - `true`  — normal flow
///
/// `AuthGate` routes to the sign-up wizard only on an explicit `false`, exactly
/// as web only redirects on `hasUsers.value === false`. `null` keeps sign-in on
/// screen, so a slow probe never flashes the wizard at a returning user.
class FirstRunCubit extends Cubit<bool?> {
  FirstRunCubit(this._instanceRepository) : super(null);

  final InstanceRepository _instanceRepository;

  /// [InstanceRepository.hasUsers] never throws — it fails closed to `true`, so
  /// a network blip cannot offer a stranger the first-admin bootstrap.
  Future<void> check() async {
    final hasUsers = await _instanceRepository.hasUsers();
    if (isClosed) return;
    emit(hasUsers);
  }
}

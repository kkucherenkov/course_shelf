/// Port — library registration, used by the sign-up wizard's step 3.
/// Implementations live in `data/`.
abstract class LibraryRepository {
  /// `POST /api/v1/libraries` — registers [rootPath] as a library named [name]
  /// and kicks off the initial scan server-side.
  ///
  /// Idempotent on `rootPath`: registering an already-known path auto-grants the
  /// caller access instead of conflicting, so 409 is not a code path. Throws on
  /// a real failure (unreadable path, network).
  Future<void> registerLibrary({
    required String name,
    required String rootPath,
  });
}

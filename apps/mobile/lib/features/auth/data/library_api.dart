import 'package:dio/dio.dart';

import 'package:app_mobile/features/auth/domain/library_repository.dart';

/// Implements [LibraryRepository] against `POST /api/v1/libraries`.
///
/// Should ride the generated `CatalogApi.registerLibrary`; see
/// [InstanceApiImpl] for why `package:app_api_client/…` does not resolve yet.
/// The body below matches the generated `RegisterLibraryRequest` (`name` +
/// `rootPath`) and web's `registerLibrary` call exactly.
class LibraryApiImpl implements LibraryRepository {
  LibraryApiImpl({required Dio dio}) : _dio = dio;

  final Dio _dio;

  @override
  Future<void> registerLibrary({
    required String name,
    required String rootPath,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      '/libraries',
      data: {'name': name, 'rootPath': rootPath},
    );
  }
}

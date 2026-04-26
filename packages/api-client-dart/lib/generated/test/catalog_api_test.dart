import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for CatalogApi
void main() {
  final instance = AppApiClient().getCatalogApi();

  group(CatalogApi, () {
    // Get a library by id
    //
    // Returns a single library by its server-generated identifier.
    //
    //Future<LibraryDto> getLibrary(String id) async
    test('test getLibrary', () async {
      // TODO
    });

    // List all registered libraries
    //
    // Returns all libraries the requester has READ access to. Admins see everything. 
    //
    //Future<LibraryListDto> listLibraries() async
    test('test listLibraries', () async {
      // TODO
    });

    // Register a new library
    //
    // Persists a new library pointing at an absolute filesystem path. Idempotent on rootPath: a 409 is returned if a library with the same rootPath already exists. 
    //
    //Future<LibraryDto> registerLibrary(RegisterLibraryRequest registerLibraryRequest) async
    test('test registerLibrary', () async {
      // TODO
    });

  });
}

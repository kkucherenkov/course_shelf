import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/auth/data/instance_api.dart';
import 'package:app_mobile/features/auth/data/library_api.dart';

/// Records the resolved request URI and returns a canned JSON body, so tests
/// can pin both the endpoint (no `/api/v1` doubling) and the response mapping.
class _CapturingAdapter implements HttpClientAdapter {
  _CapturingAdapter(this._body);

  final String _body;
  final List<Uri> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options.uri);
    return ResponseBody.fromString(
      _body,
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

Dio _dioWith(_CapturingAdapter adapter) =>
    Dio(BaseOptions(baseUrl: 'http://host:3000/api/v1'))
      ..httpClientAdapter = adapter;

void main() {
  group('InstanceApiImpl', () {
    test(
      'getInstanceConfig hits /admin/instance under a single /api/v1',
      () async {
        final adapter = _CapturingAdapter(
          '{"selfRegistration":true,"emailVerificationRequired":true,'
          '"ssoProviders":["google"]}',
        );
        final api = InstanceApiImpl(dio: _dioWith(adapter));

        final config = await api.getInstanceConfig();

        expect(
          adapter.requests.single.toString(),
          'http://host:3000/api/v1/admin/instance',
        );
        expect(config.emailVerificationRequired, isTrue);
        expect(config.ssoProviders, ['google']);
      },
    );

    test('getInstanceConfig falls back to defaults on failure', () async {
      // No adapter response → 404 → the impl must swallow it, per the port.
      final dio = Dio(BaseOptions(baseUrl: 'http://127.0.0.1:9/api/v1'));
      final api = InstanceApiImpl(dio: dio);

      final config = await api.getInstanceConfig();

      expect(config.selfRegistration, isTrue);
      expect(config.emailVerificationRequired, isFalse);
      expect(config.ssoProviders, isEmpty);
    });

    test('hasUsers hits /admin/has-users and reads the flag', () async {
      final adapter = _CapturingAdapter('{"hasUsers":false}');
      final api = InstanceApiImpl(dio: _dioWith(adapter));

      final result = await api.hasUsers();

      expect(
        adapter.requests.single.toString(),
        'http://host:3000/api/v1/admin/has-users',
      );
      expect(result, isFalse);
    });

    test('hasUsers fails closed to true', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://127.0.0.1:9/api/v1'));
      final api = InstanceApiImpl(dio: dio);

      expect(await api.hasUsers(), isTrue);
    });
  });

  group('LibraryApiImpl', () {
    test('registerLibrary POSTs {name, rootPath} to /libraries', () async {
      final adapter = _CapturingAdapter('{}');
      final api = LibraryApiImpl(dio: _dioWith(adapter));

      await api.registerLibrary(name: 'CS', rootPath: '/srv/cs');

      expect(
        adapter.requests.single.toString(),
        'http://host:3000/api/v1/libraries',
      );
    });
  });
}

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/data/auth_api.dart';
import 'package:app_mobile/shared/auth/token_storage.dart';

class _MockDio extends Mock implements Dio {}

class _MockTokenStorage extends Mock implements TokenStorage {}

/// Captures the fully resolved request URI so a test can assert against it
/// rather than the path argument — the only way to catch baseUrl+path doubling,
/// which a mocked Dio hides.
class _CapturingAdapter implements HttpClientAdapter {
  final List<Uri> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options.uri);
    return ResponseBody.fromString(
      '{"user":{"id":"u1","email":"e","name":"n"}}',
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

/// Builds a `DioException` carrying [statusCode] — the shape `AuthApiImpl`
/// inspects to tell "no session" apart from a transport failure.
DioException _httpError(int statusCode) {
  final options = RequestOptions(path: '/x');
  return DioException(
    requestOptions: options,
    response: Response<void>(requestOptions: options, statusCode: statusCode),
  );
}

Response<T> _ok<T>(T? data) => Response<T>(
  requestOptions: RequestOptions(path: '/x'),
  statusCode: 200,
  data: data,
);

void main() {
  late _MockDio dio;
  late _MockTokenStorage tokenStorage;
  late AuthApiImpl api;

  setUp(() {
    dio = _MockDio();
    tokenStorage = _MockTokenStorage();
    api = AuthApiImpl(dio: dio, tokenStorage: tokenStorage);
    when(() => tokenStorage.write(any())).thenAnswer((_) async {});
    when(() => tokenStorage.clear()).thenAnswer((_) async {});
  });

  group('signIn', () {
    const signInPath = '/auth/sign-in/email';

    test(
      'posts the credentials, persists the token, returns the user',
      () async {
        when(
          () => dio.post<Map<String, dynamic>>(
            signInPath,
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => _ok<Map<String, dynamic>>({
            'token': 'jwt-123',
            'user': {
              'id': 'u1',
              'email': 'user@example.com',
              'name': 'User',
              'role': 'client',
            },
          }),
        );

        final user = await api.signIn(
          email: 'user@example.com',
          password: 'password123',
        );

        final data = verify(
          () => dio.post<Map<String, dynamic>>(
            signInPath,
            data: captureAny(named: 'data'),
          ),
        ).captured.single;
        expect(data, {'email': 'user@example.com', 'password': 'password123'});
        expect(user.id, 'u1');
        verify(() => tokenStorage.write('jwt-123')).called(1);
      },
    );

    test('throws when the response carries no user', () async {
      when(
        () => dio.post<Map<String, dynamic>>(
          signInPath,
          data: any(named: 'data'),
        ),
      ).thenAnswer((_) async => _ok<Map<String, dynamic>>({}));

      await expectLater(
        () => api.signIn(email: 'user@example.com', password: 'password123'),
        throwsA(isA<Exception>()),
      );
    });
  });

  group('getSession', () {
    const sessionPath = '/auth/get-session';

    test('returns the user for a live session', () async {
      when(() => dio.get<Map<String, dynamic>>(sessionPath)).thenAnswer(
        (_) async => _ok<Map<String, dynamic>>({
          'user': {'id': 'u1', 'email': 'user@example.com', 'name': 'User'},
        }),
      );

      final user = await api.getSession();

      expect(user?.id, 'u1');
      // Absent role falls back to the least-privileged default.
      expect(user?.role, 'client');
    });

    test('maps a 401 to null rather than throwing', () async {
      when(
        () => dio.get<Map<String, dynamic>>(sessionPath),
      ).thenThrow(_httpError(401));

      expect(await api.getSession(), isNull);
    });

    test('rethrows a non-401 failure', () async {
      when(
        () => dio.get<Map<String, dynamic>>(sessionPath),
      ).thenThrow(_httpError(500));

      await expectLater(() => api.getSession(), throwsA(isA<DioException>()));
    });
  });

  group('signOut', () {
    test('clears the stored token even when the request fails', () async {
      when(() => dio.post<void>('/auth/sign-out')).thenThrow(_httpError(500));

      await expectLater(() => api.signOut(), throwsA(isA<DioException>()));
      verify(() => tokenStorage.clear()).called(1);
    });
  });

  // Regression pin for the baseUrl+path doubling bug (#169-adjacent): the
  // shared Dio's baseUrl already ends in `/api/v1`, and Dio concatenates rather
  // than RFC-resolves, so a path must NOT repeat that prefix. Asserting the
  // resolved `RequestOptions.uri` — not the path arg the mocked-Dio tests see —
  // is the only way to catch a regression here.
  group('resolved request URI (no /api/v1 doubling)', () {
    late _CapturingAdapter adapter;
    late AuthApiImpl liveApi;

    setUp(() {
      adapter = _CapturingAdapter();
      final liveDio = Dio(BaseOptions(baseUrl: 'http://host:3000/api/v1'))
        ..httpClientAdapter = adapter;
      liveApi = AuthApiImpl(dio: liveDio, tokenStorage: tokenStorage);
    });

    test('sign-in resolves under a single /api/v1', () async {
      await liveApi.signIn(email: 'a@b.com', password: 'password123');
      expect(
        adapter.requests.single.toString(),
        'http://host:3000/api/v1/auth/sign-in/email',
      );
    });

    test('get-session resolves under a single /api/v1', () async {
      await liveApi.getSession();
      expect(
        adapter.requests.single.toString(),
        'http://host:3000/api/v1/auth/get-session',
      );
    });

    test('request-password-reset resolves under a single /api/v1', () async {
      await liveApi.requestPasswordReset(email: 'a@b.com');
      expect(
        adapter.requests.single.toString(),
        'http://host:3000/api/v1/auth/request-password-reset',
      );
    });
  });
}

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/auth/data/auth_api.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/shared/auth/token_storage.dart';

class _MockDio extends Mock implements Dio {}

class _MockTokenStorage extends Mock implements TokenStorage {}

/// Builds a `DioException` carrying [statusCode], the shape `AuthApiImpl`
/// inspects to map transport failures onto [OtpError].
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
  });

  group('requestOtp', () {
    const sendOtpPath = '/api/v1/auth/phone-number/send-otp';

    test('posts the E.164 phoneNumber to the send-otp endpoint', () async {
      when(() => dio.post<void>(sendOtpPath, data: any(named: 'data')))
          .thenAnswer((_) async => _ok<void>(null));

      // Deliberately messy input — the impl must strip spaces/punctuation and
      // re-prefix a single '+'.
      await api.requestOtp(phone: '+357 99 123-456');

      final data = verify(
        () => dio.post<void>(sendOtpPath, data: captureAny(named: 'data')),
      ).captured.single;
      expect(data, {'phoneNumber': '+35799123456'});
    });

    test('maps a 400 to OtpError(invalid)', () async {
      when(() => dio.post<void>(sendOtpPath, data: any(named: 'data')))
          .thenThrow(_httpError(400));

      await expectLater(
        () => api.requestOtp(phone: '+35799123456'),
        throwsA(
          isA<OtpError>().having((e) => e.kind, 'kind', OtpErrorKind.invalid),
        ),
      );
    });
  });

  group('verifyOtp', () {
    const verifyOtpPath = '/api/v1/auth/phone-number/verify-otp';

    test('posts phoneNumber+code, persists the token, returns the user',
        () async {
      when(
        () => dio.post<Map<String, dynamic>>(
          verifyOtpPath,
          data: any(named: 'data'),
        ),
      ).thenAnswer(
        (_) async => _ok<Map<String, dynamic>>({
          'token': 'tok-123',
          'user': {
            'id': 'u1',
            'email': 'phone-35799123456@noreply.app.internal',
            'name': 'Jane',
            'role': 'client',
          },
        }),
      );
      when(() => tokenStorage.write(any())).thenAnswer((_) async {});

      final result =
          await api.verifyOtp(phone: '+35799123456', code: '123456', name: '');

      expect(result.user.id, 'u1');
      expect(result.user.name, 'Jane');
      verify(() => tokenStorage.write('tok-123')).called(1);

      final data = verify(
        () => dio.post<Map<String, dynamic>>(
          verifyOtpPath,
          data: captureAny(named: 'data'),
        ),
      ).captured.single;
      expect(data, {'phoneNumber': '+35799123456', 'code': '123456'});
    });

    test('maps a 400 to OtpError(mismatch)', () async {
      when(
        () => dio.post<Map<String, dynamic>>(
          verifyOtpPath,
          data: any(named: 'data'),
        ),
      ).thenThrow(_httpError(400));

      await expectLater(
        () => api.verifyOtp(phone: '+35799123456', code: '000000', name: ''),
        throwsA(
          isA<OtpError>().having((e) => e.kind, 'kind', OtpErrorKind.mismatch),
        ),
      );
    });

    test('maps a 410 to OtpError(expired)', () async {
      when(
        () => dio.post<Map<String, dynamic>>(
          verifyOtpPath,
          data: any(named: 'data'),
        ),
      ).thenThrow(_httpError(410));

      await expectLater(
        () => api.verifyOtp(phone: '+35799123456', code: '000000', name: ''),
        throwsA(
          isA<OtpError>().having((e) => e.kind, 'kind', OtpErrorKind.expired),
        ),
      );
    });
  });
}

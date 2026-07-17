import 'package:dio/dio.dart';

import 'package:app_mobile/features/auth/domain/auth_exception.dart';
import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/shared/auth/token_storage.dart';

/// Implements [AuthRepository] by calling Better Auth endpoints directly via
/// Dio.  Better Auth owns its own wire format and is not part of the generated
/// `app_api_client`, so we call the endpoints manually here.
///
/// **Paths carry NO `/api/v1` prefix.** The shared Dio's `baseUrl` is
/// `AppConfig.apiBaseUrl`, which already ends in `/api/v1`, and Dio
/// *string-concatenates* `baseUrl + path` rather than doing RFC URI resolution
/// — so `'/auth/sign-in/email'` resolves to `…/api/v1/auth/sign-in/email`,
/// while a leading `'/api/v1/…'` would double to `…/api/v1/api/v1/…`. Verified
/// against `RequestOptions.uri`; regression-pinned in `auth_api_test.dart`.
/// Better Auth is mounted at `/api/v1/auth/*`, so `/auth/*` is correct here.
class AuthApiImpl implements AuthRepository {
  AuthApiImpl({required Dio dio, required TokenStorage tokenStorage})
    : _dio = dio,
      _tokenStorage = tokenStorage;

  final Dio _dio;
  final TokenStorage _tokenStorage;

  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _wrapErrors(
      () => _dio.post<Map<String, dynamic>>(
        '/auth/sign-in/email',
        data: {'email': email, 'password': password},
      ),
    );
    return _handleAuthResponse(response.data);
  }

  @override
  Future<AuthUser> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _wrapErrors(
      () => _dio.post<Map<String, dynamic>>(
        '/auth/sign-up/email',
        data: {'name': name, 'email': email, 'password': password},
      ),
    );
    return _handleAuthResponse(response.data);
  }

  @override
  Future<void> signOut() async {
    try {
      await _dio.post<void>('/auth/sign-out');
    } finally {
      await _tokenStorage.clear();
    }
  }

  @override
  Future<AuthUser?> getSession() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/auth/get-session',
      );
      final data = response.data;
      if (data == null) return null;
      final user = data['user'];
      if (user == null) return null;
      return AuthUser(
        id: user['id'] as String,
        email: user['email'] as String,
        name: (user['name'] as String?) ?? '',
        role: (user['role'] as String?) ?? 'client',
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) return null;
      rethrow;
    }
  }

  @override
  Future<void> requestPasswordReset({required String email}) async {
    await _wrapErrors(
      () => _dio.post<Map<String, dynamic>>(
        '/auth/request-password-reset',
        data: {'email': email},
      ),
    );
  }

  @override
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _wrapErrors(
      () => _dio.post<Map<String, dynamic>>(
        '/auth/reset-password',
        data: {'token': token, 'newPassword': newPassword},
      ),
    );
  }

  /// The 6-digit code the design calls for is Better Auth's `emailOTP` plugin
  /// (`POST /email-otp/verify-email`, body `{email, otp}`) — core Better Auth
  /// email verification is link/token-based, not a code, so it cannot back this
  /// UI. The backend enables neither today: `auth.service.ts` registers only
  /// `[admin(), bearer()]`.
  ///
  /// Wired to the canonical endpoint rather than stubbed so that turning the
  /// plugin on server-side is the only remaining step. Unreachable in v1 —
  /// `emailVerificationRequired` is false, so the verify step never renders.
  @override
  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    await _wrapErrors(
      () => _dio.post<Map<String, dynamic>>(
        '/auth/email-otp/verify-email',
        data: {'email': email, 'otp': code},
      ),
    );
  }

  /// Translates a Better Auth error response into an [AuthException] carrying
  /// its machine `code`, so `presentation/` can branch without touching Dio.
  ///
  /// Applied only to the calls whose `code` changes what the user sees;
  /// `getSession` and `signOut` keep their Dio-level contract.
  Future<Response<Map<String, dynamic>>> _wrapErrors(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      return await send();
    } on DioException catch (e) {
      final data = e.response?.data;
      final code = data is Map<String, dynamic>
          ? data['code'] as String?
          : null;
      final message = data is Map<String, dynamic>
          ? data['message'] as String?
          : null;
      throw AuthException(
        code: code,
        message: message ?? e.message,
        statusCode: e.response?.statusCode,
        retryAfterSeconds: _retryAfterOf(e.response),
      );
    }
  }

  /// `Retry-After` in seconds, when the server sent a numeric one. Better Auth's
  /// rate limiter emits the delta-seconds form; the HTTP-date form is not
  /// parsed (Better Auth never sends it) and reads as null, which the caller
  /// treats the same as "absent".
  int? _retryAfterOf(Response<dynamic>? response) {
    final raw = response?.headers.value('retry-after');
    if (raw == null) return null;
    return int.tryParse(raw.trim());
  }

  AuthUser _handleAuthResponse(Map<String, dynamic>? data) {
    if (data == null) throw Exception('Empty auth response');
    final token = data['token'] as String?;
    if (token != null && token.isNotEmpty) {
      // Fire-and-forget token persistence; Dio interceptor will pick it up
      // for subsequent requests.
      _tokenStorage.write(token);
    }
    final user = data['user'] as Map<String, dynamic>?;
    if (user == null) throw Exception('No user in auth response');
    return AuthUser(
      id: user['id'] as String,
      email: user['email'] as String,
      name: (user['name'] as String?) ?? '',
      role: (user['role'] as String?) ?? 'client',
    );
  }
}

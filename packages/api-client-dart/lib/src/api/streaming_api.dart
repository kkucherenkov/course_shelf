//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'dart:typed_data';
import 'package:app_api_client/src/api_util.dart';
import 'package:app_api_client/src/model/material_download_url_dto.dart';
import 'package:app_api_client/src/model/stream_url_dto.dart';

class StreamingApi {

  final Dio _dio;

  final Serializers _serializers;

  const StreamingApi(this._dio, this._serializers);

  /// Mint a short-lived signed URL to download a lesson material
  /// Returns a URL pointing at &#x60;/api/v1/stream/materials/{materialId}&#x60; with a signed query-param token bound to &#x60;(userId, materialId, expiresAt)&#x60;. The token is HMAC-signed with a different scope than the video stream token so a video token cannot be re-used to fetch a material (and vice versa). The streaming endpoint verifies the token without a database lookup. Default TTL is 5 minutes — short because clicking a download link should resolve immediately.  Authorization mirrors &#x60;issueStreamUrl&#x60;: the requester must have a READ grant on the parent library or course, or be an admin. 
  ///
  /// Parameters:
  /// * [lessonId] - Server-generated cuid identifying the parent lesson.
  /// * [materialId] - Server-generated cuid identifying the material.
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [MaterialDownloadUrlDto] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<MaterialDownloadUrlDto>> issueMaterialDownloadUrl({ 
    required String lessonId,
    required String materialId,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/lessons/{lessonId}/materials/{materialId}/download-url'.replaceAll('{' r'lessonId' '}', encodeQueryParameter(_serializers, lessonId, const FullType(String)).toString()).replaceAll('{' r'materialId' '}', encodeQueryParameter(_serializers, materialId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'http',
            'scheme': 'bearer',
            'name': 'bearerAuth',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    MaterialDownloadUrlDto? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(MaterialDownloadUrlDto),
      ) as MaterialDownloadUrlDto;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<MaterialDownloadUrlDto>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

  /// Mint a short-lived signed URL for a lesson video
  /// Returns a URL pointing at &#x60;/api/v1/stream/lessons/{id}&#x60; with a signed query-param token bound to &#x60;(userId, lessonId, expiresAt)&#x60;. The token is HMAC-signed; the streaming endpoint verifies it without a database lookup. Default TTL is 15 minutes (configurable server-side). Clients must request a fresh URL when the previous one expires — refresh policy is up to the player. 
  ///
  /// Parameters:
  /// * [id] - Server-generated cuid identifying the lesson.
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [StreamUrlDto] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<StreamUrlDto>> issueStreamUrl({ 
    required String id,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/lessons/{id}/stream-url'.replaceAll('{' r'id' '}', encodeQueryParameter(_serializers, id, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'http',
            'scheme': 'bearer',
            'name': 'bearerAuth',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    StreamUrlDto? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(StreamUrlDto),
      ) as StreamUrlDto;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<StreamUrlDto>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

  /// Serve a lesson&#39;s subtitle track as WebVTT
  /// Always &#x60;text/vtt&#x60;, whatever the source was: an &#x60;.srt&#x60; sidecar is converted on the fly and the result cached next to it as &#x60;*.cache.vtt&#x60; (which the scanner then knows to ignore).  Same token as the video endpoint — a &#x60;&lt;track&gt;&#x60; element cannot send an Authorization header either. 
  ///
  /// Parameters:
  /// * [id] - Lesson cuid.
  /// * [language] - Language code as discovered by the scan, e.g. `en`.
  /// * [token] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [String] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<String>> streamLessonSubtitle({ 
    required String id,
    required String language,
    required String token,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream/lessons/{id}/subtitles/{language}'.replaceAll('{' r'id' '}', encodeQueryParameter(_serializers, id, const FullType(String)).toString()).replaceAll('{' r'language' '}', encodeQueryParameter(_serializers, language, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      r'token': encodeQueryParameter(_serializers, token, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    String? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as String;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<String>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

  /// Stream a lesson&#39;s video, with byte-range support
  /// Progressive HTTP delivery — no HLS, no DASH, no transcoding (ADR-0009). Honours &#x60;Range&#x60;, so seeking is a 206 rather than a re-download.  Authenticated by the &#x60;token&#x60; query parameter minted by &#x60;GET /api/v1/lessons/{id}/stream-url&#x60;, not by a session: a &#x60;&lt;video&gt;&#x60; element cannot send an Authorization header. The token is bound to &#x60;(userId, lessonId, expiresAt)&#x60; and lives 15 minutes by default.  Responds with &#x60;Cross-Origin-Resource-Policy: cross-origin&#x60; so the SPA can embed it from the proxy origin, the bare Nuxt origin, or a production domain. 
  ///
  /// Parameters:
  /// * [id] - Lesson cuid.
  /// * [token] - Signed stream token from `issueStreamUrl`.
  /// * [range] - Standard byte range, e.g. `bytes=0-1048575`.
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Uint8List] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Uint8List>> streamLessonVideo({ 
    required String id,
    required String token,
    String? range,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream/lessons/{id}'.replaceAll('{' r'id' '}', encodeQueryParameter(_serializers, id, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      responseType: ResponseType.bytes,
      headers: <String, dynamic>{
        if (range != null) r'Range': range,
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      r'token': encodeQueryParameter(_serializers, token, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Uint8List? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as Uint8List;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Uint8List>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

  /// Download a lesson material
  /// Serves a course material (PDF, slides, an image) as an attachment.  Uses a **material-scoped** token from &#x60;GET /api/v1/lessons/{lessonId}/materials/{materialId}/download-url&#x60;, distinct from the video token: it embeds the owning &#x60;lessonId&#x60;, and the handler re-checks that the material still belongs to that lesson — token binding plus a database check, rather than either alone. 
  ///
  /// Parameters:
  /// * [materialId] - Material cuid.
  /// * [token] - Signed material token from `issueMaterialDownloadUrl`.
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Uint8List] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Uint8List>> streamMaterial({ 
    required String materialId,
    required String token,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream/materials/{materialId}'.replaceAll('{' r'materialId' '}', encodeQueryParameter(_serializers, materialId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      responseType: ResponseType.bytes,
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      r'token': encodeQueryParameter(_serializers, token, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Uint8List? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as Uint8List;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Uint8List>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

}

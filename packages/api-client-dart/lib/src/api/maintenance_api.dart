//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:app_api_client/src/model/backfill_job_accepted.dart';
import 'package:app_api_client/src/model/backfill_metadata_request.dart';

class MaintenanceApi {

  final Dio _dio;

  final Serializers _serializers;

  const MaintenanceApi(this._dio, this._serializers);

  /// Trigger a background metadata backfill across the library
  /// Enqueues a background job that walks every course in the specified library (or all libraries when &#x60;libraryId&#x60; is omitted), reads each course&#39;s &#x60;course.json&#x60;, and upserts instructor/studio/tag links and extended fields. Returns 202 immediately with a &#x60;jobId&#x60;; subscribe to the &#x60;maintenance:backfill:{jobId}&#x60; Centrifugo channel to track progress. Admin only. 
  ///
  /// Parameters:
  /// * [backfillMetadataRequest] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [BackfillJobAccepted] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<BackfillJobAccepted>> startBackfillMetadata({ 
    BackfillMetadataRequest? backfillMetadataRequest,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/admin/maintenance/backfill-metadata';
    final _options = Options(
      method: r'POST',
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
      contentType: 'application/json',
      validateStatus: validateStatus,
    );

    dynamic _bodyData;

    try {
      const _type = FullType(BackfillMetadataRequest);
      _bodyData = backfillMetadataRequest == null ? null : _serializers.serialize(backfillMetadataRequest, specifiedType: _type);

    } catch(error, stackTrace) {
      throw DioException(
         requestOptions: _options.compose(
          _dio.options,
          _path,
        ),
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    final _response = await _dio.request<Object>(
      _path,
      data: _bodyData,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    BackfillJobAccepted? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(BackfillJobAccepted),
      ) as BackfillJobAccepted;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<BackfillJobAccepted>(
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

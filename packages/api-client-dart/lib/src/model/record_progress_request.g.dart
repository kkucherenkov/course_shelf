// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'record_progress_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecordProgressRequest extends RecordProgressRequest {
  @override
  final String lessonId;
  @override
  final int positionSeconds;
  @override
  final int durationSeconds;
  @override
  final DateTime clientUpdatedAt;

  factory _$RecordProgressRequest([
    void Function(RecordProgressRequestBuilder)? updates,
  ]) => (RecordProgressRequestBuilder()..update(updates))._build();

  _$RecordProgressRequest._({
    required this.lessonId,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.clientUpdatedAt,
  }) : super._();
  @override
  RecordProgressRequest rebuild(
    void Function(RecordProgressRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RecordProgressRequestBuilder toBuilder() =>
      RecordProgressRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecordProgressRequest &&
        lessonId == other.lessonId &&
        positionSeconds == other.positionSeconds &&
        durationSeconds == other.durationSeconds &&
        clientUpdatedAt == other.clientUpdatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, positionSeconds.hashCode);
    _$hash = $jc(_$hash, durationSeconds.hashCode);
    _$hash = $jc(_$hash, clientUpdatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RecordProgressRequest')
          ..add('lessonId', lessonId)
          ..add('positionSeconds', positionSeconds)
          ..add('durationSeconds', durationSeconds)
          ..add('clientUpdatedAt', clientUpdatedAt))
        .toString();
  }
}

class RecordProgressRequestBuilder
    implements Builder<RecordProgressRequest, RecordProgressRequestBuilder> {
  _$RecordProgressRequest? _$v;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  int? _positionSeconds;
  int? get positionSeconds => _$this._positionSeconds;
  set positionSeconds(int? positionSeconds) =>
      _$this._positionSeconds = positionSeconds;

  int? _durationSeconds;
  int? get durationSeconds => _$this._durationSeconds;
  set durationSeconds(int? durationSeconds) =>
      _$this._durationSeconds = durationSeconds;

  DateTime? _clientUpdatedAt;
  DateTime? get clientUpdatedAt => _$this._clientUpdatedAt;
  set clientUpdatedAt(DateTime? clientUpdatedAt) =>
      _$this._clientUpdatedAt = clientUpdatedAt;

  RecordProgressRequestBuilder() {
    RecordProgressRequest._defaults(this);
  }

  RecordProgressRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lessonId = $v.lessonId;
      _positionSeconds = $v.positionSeconds;
      _durationSeconds = $v.durationSeconds;
      _clientUpdatedAt = $v.clientUpdatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecordProgressRequest other) {
    _$v = other as _$RecordProgressRequest;
  }

  @override
  void update(void Function(RecordProgressRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecordProgressRequest build() => _build();

  _$RecordProgressRequest _build() {
    final _$result =
        _$v ??
        _$RecordProgressRequest._(
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'RecordProgressRequest',
            'lessonId',
          ),
          positionSeconds: BuiltValueNullFieldError.checkNotNull(
            positionSeconds,
            r'RecordProgressRequest',
            'positionSeconds',
          ),
          durationSeconds: BuiltValueNullFieldError.checkNotNull(
            durationSeconds,
            r'RecordProgressRequest',
            'durationSeconds',
          ),
          clientUpdatedAt: BuiltValueNullFieldError.checkNotNull(
            clientUpdatedAt,
            r'RecordProgressRequest',
            'clientUpdatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

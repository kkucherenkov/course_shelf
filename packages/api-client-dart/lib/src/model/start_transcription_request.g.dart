// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'start_transcription_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StartTranscriptionRequest extends StartTranscriptionRequest {
  @override
  final bool? force;

  factory _$StartTranscriptionRequest([
    void Function(StartTranscriptionRequestBuilder)? updates,
  ]) => (StartTranscriptionRequestBuilder()..update(updates))._build();

  _$StartTranscriptionRequest._({this.force}) : super._();
  @override
  StartTranscriptionRequest rebuild(
    void Function(StartTranscriptionRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  StartTranscriptionRequestBuilder toBuilder() =>
      StartTranscriptionRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StartTranscriptionRequest && force == other.force;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, force.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'StartTranscriptionRequest',
    )..add('force', force)).toString();
  }
}

class StartTranscriptionRequestBuilder
    implements
        Builder<StartTranscriptionRequest, StartTranscriptionRequestBuilder> {
  _$StartTranscriptionRequest? _$v;

  bool? _force;
  bool? get force => _$this._force;
  set force(bool? force) => _$this._force = force;

  StartTranscriptionRequestBuilder() {
    StartTranscriptionRequest._defaults(this);
  }

  StartTranscriptionRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _force = $v.force;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StartTranscriptionRequest other) {
    _$v = other as _$StartTranscriptionRequest;
  }

  @override
  void update(void Function(StartTranscriptionRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StartTranscriptionRequest build() => _build();

  _$StartTranscriptionRequest _build() {
    final _$result = _$v ?? _$StartTranscriptionRequest._(force: force);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

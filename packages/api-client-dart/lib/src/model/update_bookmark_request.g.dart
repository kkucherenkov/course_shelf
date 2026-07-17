// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_bookmark_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateBookmarkRequest extends UpdateBookmarkRequest {
  @override
  final int? positionSeconds;
  @override
  final String? label;

  factory _$UpdateBookmarkRequest([
    void Function(UpdateBookmarkRequestBuilder)? updates,
  ]) => (UpdateBookmarkRequestBuilder()..update(updates))._build();

  _$UpdateBookmarkRequest._({this.positionSeconds, this.label}) : super._();
  @override
  UpdateBookmarkRequest rebuild(
    void Function(UpdateBookmarkRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpdateBookmarkRequestBuilder toBuilder() =>
      UpdateBookmarkRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateBookmarkRequest &&
        positionSeconds == other.positionSeconds &&
        label == other.label;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, positionSeconds.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateBookmarkRequest')
          ..add('positionSeconds', positionSeconds)
          ..add('label', label))
        .toString();
  }
}

class UpdateBookmarkRequestBuilder
    implements Builder<UpdateBookmarkRequest, UpdateBookmarkRequestBuilder> {
  _$UpdateBookmarkRequest? _$v;

  int? _positionSeconds;
  int? get positionSeconds => _$this._positionSeconds;
  set positionSeconds(int? positionSeconds) =>
      _$this._positionSeconds = positionSeconds;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  UpdateBookmarkRequestBuilder() {
    UpdateBookmarkRequest._defaults(this);
  }

  UpdateBookmarkRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _positionSeconds = $v.positionSeconds;
      _label = $v.label;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateBookmarkRequest other) {
    _$v = other as _$UpdateBookmarkRequest;
  }

  @override
  void update(void Function(UpdateBookmarkRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateBookmarkRequest build() => _build();

  _$UpdateBookmarkRequest _build() {
    final _$result =
        _$v ??
        _$UpdateBookmarkRequest._(
          positionSeconds: positionSeconds,
          label: label,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

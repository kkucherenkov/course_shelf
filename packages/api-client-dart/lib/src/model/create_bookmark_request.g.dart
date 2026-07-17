// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_bookmark_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateBookmarkRequest extends CreateBookmarkRequest {
  @override
  final int positionSeconds;
  @override
  final String? label;

  factory _$CreateBookmarkRequest([
    void Function(CreateBookmarkRequestBuilder)? updates,
  ]) => (CreateBookmarkRequestBuilder()..update(updates))._build();

  _$CreateBookmarkRequest._({required this.positionSeconds, this.label})
    : super._();
  @override
  CreateBookmarkRequest rebuild(
    void Function(CreateBookmarkRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  CreateBookmarkRequestBuilder toBuilder() =>
      CreateBookmarkRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateBookmarkRequest &&
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
    return (newBuiltValueToStringHelper(r'CreateBookmarkRequest')
          ..add('positionSeconds', positionSeconds)
          ..add('label', label))
        .toString();
  }
}

class CreateBookmarkRequestBuilder
    implements Builder<CreateBookmarkRequest, CreateBookmarkRequestBuilder> {
  _$CreateBookmarkRequest? _$v;

  int? _positionSeconds;
  int? get positionSeconds => _$this._positionSeconds;
  set positionSeconds(int? positionSeconds) =>
      _$this._positionSeconds = positionSeconds;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  CreateBookmarkRequestBuilder() {
    CreateBookmarkRequest._defaults(this);
  }

  CreateBookmarkRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _positionSeconds = $v.positionSeconds;
      _label = $v.label;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateBookmarkRequest other) {
    _$v = other as _$CreateBookmarkRequest;
  }

  @override
  void update(void Function(CreateBookmarkRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateBookmarkRequest build() => _build();

  _$CreateBookmarkRequest _build() {
    final _$result =
        _$v ??
        _$CreateBookmarkRequest._(
          positionSeconds: BuiltValueNullFieldError.checkNotNull(
            positionSeconds,
            r'CreateBookmarkRequest',
            'positionSeconds',
          ),
          label: label,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

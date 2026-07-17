// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upsert_note_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpsertNoteRequest extends UpsertNoteRequest {
  @override
  final String lessonId;
  @override
  final String body;

  factory _$UpsertNoteRequest([
    void Function(UpsertNoteRequestBuilder)? updates,
  ]) => (UpsertNoteRequestBuilder()..update(updates))._build();

  _$UpsertNoteRequest._({required this.lessonId, required this.body})
    : super._();
  @override
  UpsertNoteRequest rebuild(void Function(UpsertNoteRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpsertNoteRequestBuilder toBuilder() =>
      UpsertNoteRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpsertNoteRequest &&
        lessonId == other.lessonId &&
        body == other.body;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpsertNoteRequest')
          ..add('lessonId', lessonId)
          ..add('body', body))
        .toString();
  }
}

class UpsertNoteRequestBuilder
    implements Builder<UpsertNoteRequest, UpsertNoteRequestBuilder> {
  _$UpsertNoteRequest? _$v;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  UpsertNoteRequestBuilder() {
    UpsertNoteRequest._defaults(this);
  }

  UpsertNoteRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lessonId = $v.lessonId;
      _body = $v.body;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpsertNoteRequest other) {
    _$v = other as _$UpsertNoteRequest;
  }

  @override
  void update(void Function(UpsertNoteRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpsertNoteRequest build() => _build();

  _$UpsertNoteRequest _build() {
    final _$result =
        _$v ??
        _$UpsertNoteRequest._(
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'UpsertNoteRequest',
            'lessonId',
          ),
          body: BuiltValueNullFieldError.checkNotNull(
            body,
            r'UpsertNoteRequest',
            'body',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

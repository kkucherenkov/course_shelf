// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'note_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NoteDto extends NoteDto {
  @override
  final String id;
  @override
  final String lessonId;
  @override
  final String body;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$NoteDto([void Function(NoteDtoBuilder)? updates]) =>
      (NoteDtoBuilder()..update(updates))._build();

  _$NoteDto._({
    required this.id,
    required this.lessonId,
    required this.body,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  NoteDto rebuild(void Function(NoteDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  NoteDtoBuilder toBuilder() => NoteDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NoteDto &&
        id == other.id &&
        lessonId == other.lessonId &&
        body == other.body &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'NoteDto')
          ..add('id', id)
          ..add('lessonId', lessonId)
          ..add('body', body)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class NoteDtoBuilder implements Builder<NoteDto, NoteDtoBuilder> {
  _$NoteDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  NoteDtoBuilder() {
    NoteDto._defaults(this);
  }

  NoteDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _lessonId = $v.lessonId;
      _body = $v.body;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NoteDto other) {
    _$v = other as _$NoteDto;
  }

  @override
  void update(void Function(NoteDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  NoteDto build() => _build();

  _$NoteDto _build() {
    final _$result =
        _$v ??
        _$NoteDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'NoteDto', 'id'),
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'NoteDto',
            'lessonId',
          ),
          body: BuiltValueNullFieldError.checkNotNull(body, r'NoteDto', 'body'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'NoteDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'NoteDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

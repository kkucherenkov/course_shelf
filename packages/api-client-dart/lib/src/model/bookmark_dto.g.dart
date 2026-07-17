// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bookmark_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BookmarkDto extends BookmarkDto {
  @override
  final String id;
  @override
  final String lessonId;
  @override
  final int positionSeconds;
  @override
  final String? label;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$BookmarkDto([void Function(BookmarkDtoBuilder)? updates]) =>
      (BookmarkDtoBuilder()..update(updates))._build();

  _$BookmarkDto._({
    required this.id,
    required this.lessonId,
    required this.positionSeconds,
    this.label,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  BookmarkDto rebuild(void Function(BookmarkDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BookmarkDtoBuilder toBuilder() => BookmarkDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BookmarkDto &&
        id == other.id &&
        lessonId == other.lessonId &&
        positionSeconds == other.positionSeconds &&
        label == other.label &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, positionSeconds.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BookmarkDto')
          ..add('id', id)
          ..add('lessonId', lessonId)
          ..add('positionSeconds', positionSeconds)
          ..add('label', label)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class BookmarkDtoBuilder implements Builder<BookmarkDto, BookmarkDtoBuilder> {
  _$BookmarkDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  int? _positionSeconds;
  int? get positionSeconds => _$this._positionSeconds;
  set positionSeconds(int? positionSeconds) =>
      _$this._positionSeconds = positionSeconds;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  BookmarkDtoBuilder() {
    BookmarkDto._defaults(this);
  }

  BookmarkDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _lessonId = $v.lessonId;
      _positionSeconds = $v.positionSeconds;
      _label = $v.label;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BookmarkDto other) {
    _$v = other as _$BookmarkDto;
  }

  @override
  void update(void Function(BookmarkDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BookmarkDto build() => _build();

  _$BookmarkDto _build() {
    final _$result =
        _$v ??
        _$BookmarkDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'BookmarkDto', 'id'),
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'BookmarkDto',
            'lessonId',
          ),
          positionSeconds: BuiltValueNullFieldError.checkNotNull(
            positionSeconds,
            r'BookmarkDto',
            'positionSeconds',
          ),
          label: label,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'BookmarkDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'BookmarkDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

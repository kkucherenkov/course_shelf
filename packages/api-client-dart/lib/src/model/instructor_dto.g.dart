// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'instructor_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstructorDto extends InstructorDto {
  @override
  final String id;
  @override
  final String slug;
  @override
  final String displayName;
  @override
  final BuiltList<ExternalIdRef> externalIds;
  @override
  final int coursesTotal;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$InstructorDto([void Function(InstructorDtoBuilder)? updates]) =>
      (InstructorDtoBuilder()..update(updates))._build();

  _$InstructorDto._({
    required this.id,
    required this.slug,
    required this.displayName,
    required this.externalIds,
    required this.coursesTotal,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  InstructorDto rebuild(void Function(InstructorDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InstructorDtoBuilder toBuilder() => InstructorDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstructorDto &&
        id == other.id &&
        slug == other.slug &&
        displayName == other.displayName &&
        externalIds == other.externalIds &&
        coursesTotal == other.coursesTotal &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jc(_$hash, coursesTotal.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InstructorDto')
          ..add('id', id)
          ..add('slug', slug)
          ..add('displayName', displayName)
          ..add('externalIds', externalIds)
          ..add('coursesTotal', coursesTotal)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class InstructorDtoBuilder
    implements Builder<InstructorDto, InstructorDtoBuilder> {
  _$InstructorDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  ListBuilder<ExternalIdRef>? _externalIds;
  ListBuilder<ExternalIdRef> get externalIds =>
      _$this._externalIds ??= ListBuilder<ExternalIdRef>();
  set externalIds(ListBuilder<ExternalIdRef>? externalIds) =>
      _$this._externalIds = externalIds;

  int? _coursesTotal;
  int? get coursesTotal => _$this._coursesTotal;
  set coursesTotal(int? coursesTotal) => _$this._coursesTotal = coursesTotal;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  InstructorDtoBuilder() {
    InstructorDto._defaults(this);
  }

  InstructorDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _slug = $v.slug;
      _displayName = $v.displayName;
      _externalIds = $v.externalIds.toBuilder();
      _coursesTotal = $v.coursesTotal;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InstructorDto other) {
    _$v = other as _$InstructorDto;
  }

  @override
  void update(void Function(InstructorDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstructorDto build() => _build();

  _$InstructorDto _build() {
    _$InstructorDto _$result;
    try {
      _$result =
          _$v ??
          _$InstructorDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'InstructorDto',
              'id',
            ),
            slug: BuiltValueNullFieldError.checkNotNull(
              slug,
              r'InstructorDto',
              'slug',
            ),
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'InstructorDto',
              'displayName',
            ),
            externalIds: externalIds.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'InstructorDto',
              'coursesTotal',
            ),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'InstructorDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'InstructorDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'externalIds';
        externalIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'InstructorDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

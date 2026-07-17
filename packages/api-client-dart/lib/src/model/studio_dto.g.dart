// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studio_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StudioDto extends StudioDto {
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

  factory _$StudioDto([void Function(StudioDtoBuilder)? updates]) =>
      (StudioDtoBuilder()..update(updates))._build();

  _$StudioDto._({
    required this.id,
    required this.slug,
    required this.displayName,
    required this.externalIds,
    required this.coursesTotal,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  StudioDto rebuild(void Function(StudioDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StudioDtoBuilder toBuilder() => StudioDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StudioDto &&
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
    return (newBuiltValueToStringHelper(r'StudioDto')
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

class StudioDtoBuilder implements Builder<StudioDto, StudioDtoBuilder> {
  _$StudioDto? _$v;

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

  StudioDtoBuilder() {
    StudioDto._defaults(this);
  }

  StudioDtoBuilder get _$this {
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
  void replace(StudioDto other) {
    _$v = other as _$StudioDto;
  }

  @override
  void update(void Function(StudioDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StudioDto build() => _build();

  _$StudioDto _build() {
    _$StudioDto _$result;
    try {
      _$result =
          _$v ??
          _$StudioDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'StudioDto', 'id'),
            slug: BuiltValueNullFieldError.checkNotNull(
              slug,
              r'StudioDto',
              'slug',
            ),
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'StudioDto',
              'displayName',
            ),
            externalIds: externalIds.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'StudioDto',
              'coursesTotal',
            ),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'StudioDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'StudioDto',
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
          r'StudioDto',
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

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagDto extends TagDto {
  @override
  final String id;
  @override
  final String slug;
  @override
  final String displayName;
  @override
  final String? category;
  @override
  final BuiltList<ExternalIdRef> externalIds;
  @override
  final int coursesTotal;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$TagDto([void Function(TagDtoBuilder)? updates]) =>
      (TagDtoBuilder()..update(updates))._build();

  _$TagDto._({
    required this.id,
    required this.slug,
    required this.displayName,
    this.category,
    required this.externalIds,
    required this.coursesTotal,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  TagDto rebuild(void Function(TagDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagDtoBuilder toBuilder() => TagDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagDto &&
        id == other.id &&
        slug == other.slug &&
        displayName == other.displayName &&
        category == other.category &&
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
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jc(_$hash, coursesTotal.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagDto')
          ..add('id', id)
          ..add('slug', slug)
          ..add('displayName', displayName)
          ..add('category', category)
          ..add('externalIds', externalIds)
          ..add('coursesTotal', coursesTotal)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class TagDtoBuilder implements Builder<TagDto, TagDtoBuilder> {
  _$TagDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

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

  TagDtoBuilder() {
    TagDto._defaults(this);
  }

  TagDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _slug = $v.slug;
      _displayName = $v.displayName;
      _category = $v.category;
      _externalIds = $v.externalIds.toBuilder();
      _coursesTotal = $v.coursesTotal;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagDto other) {
    _$v = other as _$TagDto;
  }

  @override
  void update(void Function(TagDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagDto build() => _build();

  _$TagDto _build() {
    _$TagDto _$result;
    try {
      _$result =
          _$v ??
          _$TagDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'TagDto', 'id'),
            slug: BuiltValueNullFieldError.checkNotNull(
              slug,
              r'TagDto',
              'slug',
            ),
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'TagDto',
              'displayName',
            ),
            category: category,
            externalIds: externalIds.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'TagDto',
              'coursesTotal',
            ),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'TagDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'TagDto',
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
          r'TagDto',
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

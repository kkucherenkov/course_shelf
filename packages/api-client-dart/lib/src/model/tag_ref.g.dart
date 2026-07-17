// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_ref.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagRef extends TagRef {
  @override
  final String id;
  @override
  final String slug;
  @override
  final String displayName;
  @override
  final String? category;

  factory _$TagRef([void Function(TagRefBuilder)? updates]) =>
      (TagRefBuilder()..update(updates))._build();

  _$TagRef._({
    required this.id,
    required this.slug,
    required this.displayName,
    this.category,
  }) : super._();
  @override
  TagRef rebuild(void Function(TagRefBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagRefBuilder toBuilder() => TagRefBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagRef &&
        id == other.id &&
        slug == other.slug &&
        displayName == other.displayName &&
        category == other.category;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagRef')
          ..add('id', id)
          ..add('slug', slug)
          ..add('displayName', displayName)
          ..add('category', category))
        .toString();
  }
}

class TagRefBuilder implements Builder<TagRef, TagRefBuilder> {
  _$TagRef? _$v;

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

  TagRefBuilder() {
    TagRef._defaults(this);
  }

  TagRefBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _slug = $v.slug;
      _displayName = $v.displayName;
      _category = $v.category;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagRef other) {
    _$v = other as _$TagRef;
  }

  @override
  void update(void Function(TagRefBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagRef build() => _build();

  _$TagRef _build() {
    final _$result =
        _$v ??
        _$TagRef._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'TagRef', 'id'),
          slug: BuiltValueNullFieldError.checkNotNull(slug, r'TagRef', 'slug'),
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'TagRef',
            'displayName',
          ),
          category: category,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

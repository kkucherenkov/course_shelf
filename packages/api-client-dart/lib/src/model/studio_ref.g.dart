// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studio_ref.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StudioRef extends StudioRef {
  @override
  final String id;
  @override
  final String slug;
  @override
  final String displayName;

  factory _$StudioRef([void Function(StudioRefBuilder)? updates]) =>
      (StudioRefBuilder()..update(updates))._build();

  _$StudioRef._({
    required this.id,
    required this.slug,
    required this.displayName,
  }) : super._();
  @override
  StudioRef rebuild(void Function(StudioRefBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StudioRefBuilder toBuilder() => StudioRefBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StudioRef &&
        id == other.id &&
        slug == other.slug &&
        displayName == other.displayName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StudioRef')
          ..add('id', id)
          ..add('slug', slug)
          ..add('displayName', displayName))
        .toString();
  }
}

class StudioRefBuilder implements Builder<StudioRef, StudioRefBuilder> {
  _$StudioRef? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  StudioRefBuilder() {
    StudioRef._defaults(this);
  }

  StudioRefBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _slug = $v.slug;
      _displayName = $v.displayName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StudioRef other) {
    _$v = other as _$StudioRef;
  }

  @override
  void update(void Function(StudioRefBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StudioRef build() => _build();

  _$StudioRef _build() {
    final _$result =
        _$v ??
        _$StudioRef._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'StudioRef', 'id'),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'StudioRef',
            'slug',
          ),
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'StudioRef',
            'displayName',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

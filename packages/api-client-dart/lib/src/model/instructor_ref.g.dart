// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'instructor_ref.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstructorRef extends InstructorRef {
  @override
  final String id;
  @override
  final String slug;
  @override
  final String displayName;

  factory _$InstructorRef([void Function(InstructorRefBuilder)? updates]) =>
      (InstructorRefBuilder()..update(updates))._build();

  _$InstructorRef._({
    required this.id,
    required this.slug,
    required this.displayName,
  }) : super._();
  @override
  InstructorRef rebuild(void Function(InstructorRefBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InstructorRefBuilder toBuilder() => InstructorRefBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstructorRef &&
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
    return (newBuiltValueToStringHelper(r'InstructorRef')
          ..add('id', id)
          ..add('slug', slug)
          ..add('displayName', displayName))
        .toString();
  }
}

class InstructorRefBuilder
    implements Builder<InstructorRef, InstructorRefBuilder> {
  _$InstructorRef? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  InstructorRefBuilder() {
    InstructorRef._defaults(this);
  }

  InstructorRefBuilder get _$this {
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
  void replace(InstructorRef other) {
    _$v = other as _$InstructorRef;
  }

  @override
  void update(void Function(InstructorRefBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstructorRef build() => _build();

  _$InstructorRef _build() {
    final _$result =
        _$v ??
        _$InstructorRef._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'InstructorRef', 'id'),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'InstructorRef',
            'slug',
          ),
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'InstructorRef',
            'displayName',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

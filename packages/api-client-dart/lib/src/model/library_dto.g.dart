// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LibraryDto extends LibraryDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final String rootPath;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$LibraryDto([void Function(LibraryDtoBuilder)? updates]) =>
      (LibraryDtoBuilder()..update(updates))._build();

  _$LibraryDto._({
    required this.id,
    required this.name,
    required this.rootPath,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  LibraryDto rebuild(void Function(LibraryDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryDtoBuilder toBuilder() => LibraryDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryDto &&
        id == other.id &&
        name == other.name &&
        rootPath == other.rootPath &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, rootPath.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LibraryDto')
          ..add('id', id)
          ..add('name', name)
          ..add('rootPath', rootPath)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class LibraryDtoBuilder implements Builder<LibraryDto, LibraryDtoBuilder> {
  _$LibraryDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _rootPath;
  String? get rootPath => _$this._rootPath;
  set rootPath(String? rootPath) => _$this._rootPath = rootPath;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  LibraryDtoBuilder() {
    LibraryDto._defaults(this);
  }

  LibraryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _rootPath = $v.rootPath;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryDto other) {
    _$v = other as _$LibraryDto;
  }

  @override
  void update(void Function(LibraryDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryDto build() => _build();

  _$LibraryDto _build() {
    final _$result =
        _$v ??
        _$LibraryDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'LibraryDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'LibraryDto',
            'name',
          ),
          rootPath: BuiltValueNullFieldError.checkNotNull(
            rootPath,
            r'LibraryDto',
            'rootPath',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'LibraryDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'LibraryDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

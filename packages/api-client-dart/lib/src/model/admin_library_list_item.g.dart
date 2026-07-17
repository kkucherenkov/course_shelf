// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_library_list_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminLibraryListItem extends AdminLibraryListItem {
  @override
  final String id;
  @override
  final String name;
  @override
  final String rootPath;
  @override
  final int coursesCount;
  @override
  final int lessonsCount;
  @override
  final AdminLibraryListItemScan? lastScan;

  factory _$AdminLibraryListItem([
    void Function(AdminLibraryListItemBuilder)? updates,
  ]) => (AdminLibraryListItemBuilder()..update(updates))._build();

  _$AdminLibraryListItem._({
    required this.id,
    required this.name,
    required this.rootPath,
    required this.coursesCount,
    required this.lessonsCount,
    this.lastScan,
  }) : super._();
  @override
  AdminLibraryListItem rebuild(
    void Function(AdminLibraryListItemBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminLibraryListItemBuilder toBuilder() =>
      AdminLibraryListItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminLibraryListItem &&
        id == other.id &&
        name == other.name &&
        rootPath == other.rootPath &&
        coursesCount == other.coursesCount &&
        lessonsCount == other.lessonsCount &&
        lastScan == other.lastScan;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, rootPath.hashCode);
    _$hash = $jc(_$hash, coursesCount.hashCode);
    _$hash = $jc(_$hash, lessonsCount.hashCode);
    _$hash = $jc(_$hash, lastScan.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminLibraryListItem')
          ..add('id', id)
          ..add('name', name)
          ..add('rootPath', rootPath)
          ..add('coursesCount', coursesCount)
          ..add('lessonsCount', lessonsCount)
          ..add('lastScan', lastScan))
        .toString();
  }
}

class AdminLibraryListItemBuilder
    implements Builder<AdminLibraryListItem, AdminLibraryListItemBuilder> {
  _$AdminLibraryListItem? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _rootPath;
  String? get rootPath => _$this._rootPath;
  set rootPath(String? rootPath) => _$this._rootPath = rootPath;

  int? _coursesCount;
  int? get coursesCount => _$this._coursesCount;
  set coursesCount(int? coursesCount) => _$this._coursesCount = coursesCount;

  int? _lessonsCount;
  int? get lessonsCount => _$this._lessonsCount;
  set lessonsCount(int? lessonsCount) => _$this._lessonsCount = lessonsCount;

  AdminLibraryListItemScanBuilder? _lastScan;
  AdminLibraryListItemScanBuilder get lastScan =>
      _$this._lastScan ??= AdminLibraryListItemScanBuilder();
  set lastScan(AdminLibraryListItemScanBuilder? lastScan) =>
      _$this._lastScan = lastScan;

  AdminLibraryListItemBuilder() {
    AdminLibraryListItem._defaults(this);
  }

  AdminLibraryListItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _rootPath = $v.rootPath;
      _coursesCount = $v.coursesCount;
      _lessonsCount = $v.lessonsCount;
      _lastScan = $v.lastScan?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminLibraryListItem other) {
    _$v = other as _$AdminLibraryListItem;
  }

  @override
  void update(void Function(AdminLibraryListItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminLibraryListItem build() => _build();

  _$AdminLibraryListItem _build() {
    _$AdminLibraryListItem _$result;
    try {
      _$result =
          _$v ??
          _$AdminLibraryListItem._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'AdminLibraryListItem',
              'id',
            ),
            name: BuiltValueNullFieldError.checkNotNull(
              name,
              r'AdminLibraryListItem',
              'name',
            ),
            rootPath: BuiltValueNullFieldError.checkNotNull(
              rootPath,
              r'AdminLibraryListItem',
              'rootPath',
            ),
            coursesCount: BuiltValueNullFieldError.checkNotNull(
              coursesCount,
              r'AdminLibraryListItem',
              'coursesCount',
            ),
            lessonsCount: BuiltValueNullFieldError.checkNotNull(
              lessonsCount,
              r'AdminLibraryListItem',
              'lessonsCount',
            ),
            lastScan: _lastScan?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'lastScan';
        _lastScan?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminLibraryListItem',
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

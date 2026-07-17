// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_dashboard_dto_counts.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminDashboardDtoCounts extends AdminDashboardDtoCounts {
  @override
  final int libraries;
  @override
  final int users;
  @override
  final int courses;
  @override
  final int lessons;

  factory _$AdminDashboardDtoCounts([
    void Function(AdminDashboardDtoCountsBuilder)? updates,
  ]) => (AdminDashboardDtoCountsBuilder()..update(updates))._build();

  _$AdminDashboardDtoCounts._({
    required this.libraries,
    required this.users,
    required this.courses,
    required this.lessons,
  }) : super._();
  @override
  AdminDashboardDtoCounts rebuild(
    void Function(AdminDashboardDtoCountsBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminDashboardDtoCountsBuilder toBuilder() =>
      AdminDashboardDtoCountsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminDashboardDtoCounts &&
        libraries == other.libraries &&
        users == other.users &&
        courses == other.courses &&
        lessons == other.lessons;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, libraries.hashCode);
    _$hash = $jc(_$hash, users.hashCode);
    _$hash = $jc(_$hash, courses.hashCode);
    _$hash = $jc(_$hash, lessons.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminDashboardDtoCounts')
          ..add('libraries', libraries)
          ..add('users', users)
          ..add('courses', courses)
          ..add('lessons', lessons))
        .toString();
  }
}

class AdminDashboardDtoCountsBuilder
    implements
        Builder<AdminDashboardDtoCounts, AdminDashboardDtoCountsBuilder> {
  _$AdminDashboardDtoCounts? _$v;

  int? _libraries;
  int? get libraries => _$this._libraries;
  set libraries(int? libraries) => _$this._libraries = libraries;

  int? _users;
  int? get users => _$this._users;
  set users(int? users) => _$this._users = users;

  int? _courses;
  int? get courses => _$this._courses;
  set courses(int? courses) => _$this._courses = courses;

  int? _lessons;
  int? get lessons => _$this._lessons;
  set lessons(int? lessons) => _$this._lessons = lessons;

  AdminDashboardDtoCountsBuilder() {
    AdminDashboardDtoCounts._defaults(this);
  }

  AdminDashboardDtoCountsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _libraries = $v.libraries;
      _users = $v.users;
      _courses = $v.courses;
      _lessons = $v.lessons;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminDashboardDtoCounts other) {
    _$v = other as _$AdminDashboardDtoCounts;
  }

  @override
  void update(void Function(AdminDashboardDtoCountsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminDashboardDtoCounts build() => _build();

  _$AdminDashboardDtoCounts _build() {
    final _$result =
        _$v ??
        _$AdminDashboardDtoCounts._(
          libraries: BuiltValueNullFieldError.checkNotNull(
            libraries,
            r'AdminDashboardDtoCounts',
            'libraries',
          ),
          users: BuiltValueNullFieldError.checkNotNull(
            users,
            r'AdminDashboardDtoCounts',
            'users',
          ),
          courses: BuiltValueNullFieldError.checkNotNull(
            courses,
            r'AdminDashboardDtoCounts',
            'courses',
          ),
          lessons: BuiltValueNullFieldError.checkNotNull(
            lessons,
            r'AdminDashboardDtoCounts',
            'lessons',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

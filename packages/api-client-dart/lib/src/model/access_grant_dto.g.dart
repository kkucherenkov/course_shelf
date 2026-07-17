// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'access_grant_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AccessGrantDto extends AccessGrantDto {
  @override
  final String id;
  @override
  final String userId;
  @override
  final GrantTarget target;
  @override
  final GrantLevel level;
  @override
  final DateTime createdAt;

  factory _$AccessGrantDto([void Function(AccessGrantDtoBuilder)? updates]) =>
      (AccessGrantDtoBuilder()..update(updates))._build();

  _$AccessGrantDto._({
    required this.id,
    required this.userId,
    required this.target,
    required this.level,
    required this.createdAt,
  }) : super._();
  @override
  AccessGrantDto rebuild(void Function(AccessGrantDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AccessGrantDtoBuilder toBuilder() => AccessGrantDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AccessGrantDto &&
        id == other.id &&
        userId == other.userId &&
        target == other.target &&
        level == other.level &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, target.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AccessGrantDto')
          ..add('id', id)
          ..add('userId', userId)
          ..add('target', target)
          ..add('level', level)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class AccessGrantDtoBuilder
    implements Builder<AccessGrantDto, AccessGrantDtoBuilder> {
  _$AccessGrantDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  GrantTargetBuilder? _target;
  GrantTargetBuilder get target => _$this._target ??= GrantTargetBuilder();
  set target(GrantTargetBuilder? target) => _$this._target = target;

  GrantLevel? _level;
  GrantLevel? get level => _$this._level;
  set level(GrantLevel? level) => _$this._level = level;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  AccessGrantDtoBuilder() {
    AccessGrantDto._defaults(this);
  }

  AccessGrantDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _target = $v.target.toBuilder();
      _level = $v.level;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AccessGrantDto other) {
    _$v = other as _$AccessGrantDto;
  }

  @override
  void update(void Function(AccessGrantDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AccessGrantDto build() => _build();

  _$AccessGrantDto _build() {
    _$AccessGrantDto _$result;
    try {
      _$result =
          _$v ??
          _$AccessGrantDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'AccessGrantDto',
              'id',
            ),
            userId: BuiltValueNullFieldError.checkNotNull(
              userId,
              r'AccessGrantDto',
              'userId',
            ),
            target: target.build(),
            level: BuiltValueNullFieldError.checkNotNull(
              level,
              r'AccessGrantDto',
              'level',
            ),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'AccessGrantDto',
              'createdAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'target';
        target.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AccessGrantDto',
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

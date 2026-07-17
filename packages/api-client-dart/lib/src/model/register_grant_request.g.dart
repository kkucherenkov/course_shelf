// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'register_grant_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RegisterGrantRequest extends RegisterGrantRequest {
  @override
  final String userId;
  @override
  final GrantTarget target;
  @override
  final GrantLevel level;

  factory _$RegisterGrantRequest([
    void Function(RegisterGrantRequestBuilder)? updates,
  ]) => (RegisterGrantRequestBuilder()..update(updates))._build();

  _$RegisterGrantRequest._({
    required this.userId,
    required this.target,
    required this.level,
  }) : super._();
  @override
  RegisterGrantRequest rebuild(
    void Function(RegisterGrantRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RegisterGrantRequestBuilder toBuilder() =>
      RegisterGrantRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RegisterGrantRequest &&
        userId == other.userId &&
        target == other.target &&
        level == other.level;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, target.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RegisterGrantRequest')
          ..add('userId', userId)
          ..add('target', target)
          ..add('level', level))
        .toString();
  }
}

class RegisterGrantRequestBuilder
    implements Builder<RegisterGrantRequest, RegisterGrantRequestBuilder> {
  _$RegisterGrantRequest? _$v;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  GrantTargetBuilder? _target;
  GrantTargetBuilder get target => _$this._target ??= GrantTargetBuilder();
  set target(GrantTargetBuilder? target) => _$this._target = target;

  GrantLevel? _level;
  GrantLevel? get level => _$this._level;
  set level(GrantLevel? level) => _$this._level = level;

  RegisterGrantRequestBuilder() {
    RegisterGrantRequest._defaults(this);
  }

  RegisterGrantRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _userId = $v.userId;
      _target = $v.target.toBuilder();
      _level = $v.level;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RegisterGrantRequest other) {
    _$v = other as _$RegisterGrantRequest;
  }

  @override
  void update(void Function(RegisterGrantRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RegisterGrantRequest build() => _build();

  _$RegisterGrantRequest _build() {
    _$RegisterGrantRequest _$result;
    try {
      _$result =
          _$v ??
          _$RegisterGrantRequest._(
            userId: BuiltValueNullFieldError.checkNotNull(
              userId,
              r'RegisterGrantRequest',
              'userId',
            ),
            target: target.build(),
            level: BuiltValueNullFieldError.checkNotNull(
              level,
              r'RegisterGrantRequest',
              'level',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'target';
        target.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'RegisterGrantRequest',
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

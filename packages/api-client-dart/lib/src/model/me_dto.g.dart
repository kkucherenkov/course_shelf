// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'me_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MeDto extends MeDto {
  @override
  final String id;
  @override
  final String email;
  @override
  final String name;
  @override
  final String? displayName;
  @override
  final AdminUserRole role;

  factory _$MeDto([void Function(MeDtoBuilder)? updates]) =>
      (MeDtoBuilder()..update(updates))._build();

  _$MeDto._({
    required this.id,
    required this.email,
    required this.name,
    this.displayName,
    required this.role,
  }) : super._();
  @override
  MeDto rebuild(void Function(MeDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MeDtoBuilder toBuilder() => MeDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MeDto &&
        id == other.id &&
        email == other.email &&
        name == other.name &&
        displayName == other.displayName &&
        role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MeDto')
          ..add('id', id)
          ..add('email', email)
          ..add('name', name)
          ..add('displayName', displayName)
          ..add('role', role))
        .toString();
  }
}

class MeDtoBuilder implements Builder<MeDto, MeDtoBuilder> {
  _$MeDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  AdminUserRole? _role;
  AdminUserRole? get role => _$this._role;
  set role(AdminUserRole? role) => _$this._role = role;

  MeDtoBuilder() {
    MeDto._defaults(this);
  }

  MeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _email = $v.email;
      _name = $v.name;
      _displayName = $v.displayName;
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MeDto other) {
    _$v = other as _$MeDto;
  }

  @override
  void update(void Function(MeDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MeDto build() => _build();

  _$MeDto _build() {
    final _$result =
        _$v ??
        _$MeDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'MeDto', 'id'),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'MeDto',
            'email',
          ),
          name: BuiltValueNullFieldError.checkNotNull(name, r'MeDto', 'name'),
          displayName: displayName,
          role: BuiltValueNullFieldError.checkNotNull(role, r'MeDto', 'role'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

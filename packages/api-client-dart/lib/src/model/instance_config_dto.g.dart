// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'instance_config_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstanceConfigDto extends InstanceConfigDto {
  @override
  final String version;
  @override
  final bool selfRegistration;
  @override
  final bool emailVerificationRequired;
  @override
  final BuiltList<SsoProviderConfig> ssoProviders;

  factory _$InstanceConfigDto([
    void Function(InstanceConfigDtoBuilder)? updates,
  ]) => (InstanceConfigDtoBuilder()..update(updates))._build();

  _$InstanceConfigDto._({
    required this.version,
    required this.selfRegistration,
    required this.emailVerificationRequired,
    required this.ssoProviders,
  }) : super._();
  @override
  InstanceConfigDto rebuild(void Function(InstanceConfigDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InstanceConfigDtoBuilder toBuilder() =>
      InstanceConfigDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstanceConfigDto &&
        version == other.version &&
        selfRegistration == other.selfRegistration &&
        emailVerificationRequired == other.emailVerificationRequired &&
        ssoProviders == other.ssoProviders;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, selfRegistration.hashCode);
    _$hash = $jc(_$hash, emailVerificationRequired.hashCode);
    _$hash = $jc(_$hash, ssoProviders.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InstanceConfigDto')
          ..add('version', version)
          ..add('selfRegistration', selfRegistration)
          ..add('emailVerificationRequired', emailVerificationRequired)
          ..add('ssoProviders', ssoProviders))
        .toString();
  }
}

class InstanceConfigDtoBuilder
    implements Builder<InstanceConfigDto, InstanceConfigDtoBuilder> {
  _$InstanceConfigDto? _$v;

  String? _version;
  String? get version => _$this._version;
  set version(String? version) => _$this._version = version;

  bool? _selfRegistration;
  bool? get selfRegistration => _$this._selfRegistration;
  set selfRegistration(bool? selfRegistration) =>
      _$this._selfRegistration = selfRegistration;

  bool? _emailVerificationRequired;
  bool? get emailVerificationRequired => _$this._emailVerificationRequired;
  set emailVerificationRequired(bool? emailVerificationRequired) =>
      _$this._emailVerificationRequired = emailVerificationRequired;

  ListBuilder<SsoProviderConfig>? _ssoProviders;
  ListBuilder<SsoProviderConfig> get ssoProviders =>
      _$this._ssoProviders ??= ListBuilder<SsoProviderConfig>();
  set ssoProviders(ListBuilder<SsoProviderConfig>? ssoProviders) =>
      _$this._ssoProviders = ssoProviders;

  InstanceConfigDtoBuilder() {
    InstanceConfigDto._defaults(this);
  }

  InstanceConfigDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _version = $v.version;
      _selfRegistration = $v.selfRegistration;
      _emailVerificationRequired = $v.emailVerificationRequired;
      _ssoProviders = $v.ssoProviders.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InstanceConfigDto other) {
    _$v = other as _$InstanceConfigDto;
  }

  @override
  void update(void Function(InstanceConfigDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstanceConfigDto build() => _build();

  _$InstanceConfigDto _build() {
    _$InstanceConfigDto _$result;
    try {
      _$result =
          _$v ??
          _$InstanceConfigDto._(
            version: BuiltValueNullFieldError.checkNotNull(
              version,
              r'InstanceConfigDto',
              'version',
            ),
            selfRegistration: BuiltValueNullFieldError.checkNotNull(
              selfRegistration,
              r'InstanceConfigDto',
              'selfRegistration',
            ),
            emailVerificationRequired: BuiltValueNullFieldError.checkNotNull(
              emailVerificationRequired,
              r'InstanceConfigDto',
              'emailVerificationRequired',
            ),
            ssoProviders: ssoProviders.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'ssoProviders';
        ssoProviders.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'InstanceConfigDto',
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

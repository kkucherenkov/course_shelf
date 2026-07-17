// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sso_provider_config.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SsoProviderConfig extends SsoProviderConfig {
  @override
  final String id;
  @override
  final String label;
  @override
  final String iconName;

  factory _$SsoProviderConfig([
    void Function(SsoProviderConfigBuilder)? updates,
  ]) => (SsoProviderConfigBuilder()..update(updates))._build();

  _$SsoProviderConfig._({
    required this.id,
    required this.label,
    required this.iconName,
  }) : super._();
  @override
  SsoProviderConfig rebuild(void Function(SsoProviderConfigBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SsoProviderConfigBuilder toBuilder() =>
      SsoProviderConfigBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SsoProviderConfig &&
        id == other.id &&
        label == other.label &&
        iconName == other.iconName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, iconName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SsoProviderConfig')
          ..add('id', id)
          ..add('label', label)
          ..add('iconName', iconName))
        .toString();
  }
}

class SsoProviderConfigBuilder
    implements Builder<SsoProviderConfig, SsoProviderConfigBuilder> {
  _$SsoProviderConfig? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _iconName;
  String? get iconName => _$this._iconName;
  set iconName(String? iconName) => _$this._iconName = iconName;

  SsoProviderConfigBuilder() {
    SsoProviderConfig._defaults(this);
  }

  SsoProviderConfigBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _label = $v.label;
      _iconName = $v.iconName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SsoProviderConfig other) {
    _$v = other as _$SsoProviderConfig;
  }

  @override
  void update(void Function(SsoProviderConfigBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SsoProviderConfig build() => _build();

  _$SsoProviderConfig _build() {
    final _$result =
        _$v ??
        _$SsoProviderConfig._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'SsoProviderConfig',
            'id',
          ),
          label: BuiltValueNullFieldError.checkNotNull(
            label,
            r'SsoProviderConfig',
            'label',
          ),
          iconName: BuiltValueNullFieldError.checkNotNull(
            iconName,
            r'SsoProviderConfig',
            'iconName',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

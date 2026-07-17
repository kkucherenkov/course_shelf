// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'health_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HealthStatus extends HealthStatus {
  @override
  final DependencyStatus? status;
  @override
  final String? version;
  @override
  final int uptimeSeconds;
  @override
  final HealthStatusDependencies dependencies;

  factory _$HealthStatus([void Function(HealthStatusBuilder)? updates]) =>
      (HealthStatusBuilder()..update(updates))._build();

  _$HealthStatus._({
    this.status,
    this.version,
    required this.uptimeSeconds,
    required this.dependencies,
  }) : super._();
  @override
  HealthStatus rebuild(void Function(HealthStatusBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HealthStatusBuilder toBuilder() => HealthStatusBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HealthStatus &&
        status == other.status &&
        version == other.version &&
        uptimeSeconds == other.uptimeSeconds &&
        dependencies == other.dependencies;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, uptimeSeconds.hashCode);
    _$hash = $jc(_$hash, dependencies.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HealthStatus')
          ..add('status', status)
          ..add('version', version)
          ..add('uptimeSeconds', uptimeSeconds)
          ..add('dependencies', dependencies))
        .toString();
  }
}

class HealthStatusBuilder
    implements Builder<HealthStatus, HealthStatusBuilder> {
  _$HealthStatus? _$v;

  DependencyStatus? _status;
  DependencyStatus? get status => _$this._status;
  set status(DependencyStatus? status) => _$this._status = status;

  String? _version;
  String? get version => _$this._version;
  set version(String? version) => _$this._version = version;

  int? _uptimeSeconds;
  int? get uptimeSeconds => _$this._uptimeSeconds;
  set uptimeSeconds(int? uptimeSeconds) =>
      _$this._uptimeSeconds = uptimeSeconds;

  HealthStatusDependenciesBuilder? _dependencies;
  HealthStatusDependenciesBuilder get dependencies =>
      _$this._dependencies ??= HealthStatusDependenciesBuilder();
  set dependencies(HealthStatusDependenciesBuilder? dependencies) =>
      _$this._dependencies = dependencies;

  HealthStatusBuilder() {
    HealthStatus._defaults(this);
  }

  HealthStatusBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _version = $v.version;
      _uptimeSeconds = $v.uptimeSeconds;
      _dependencies = $v.dependencies.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HealthStatus other) {
    _$v = other as _$HealthStatus;
  }

  @override
  void update(void Function(HealthStatusBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HealthStatus build() => _build();

  _$HealthStatus _build() {
    _$HealthStatus _$result;
    try {
      _$result =
          _$v ??
          _$HealthStatus._(
            status: status,
            version: version,
            uptimeSeconds: BuiltValueNullFieldError.checkNotNull(
              uptimeSeconds,
              r'HealthStatus',
              'uptimeSeconds',
            ),
            dependencies: dependencies.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'dependencies';
        dependencies.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'HealthStatus',
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

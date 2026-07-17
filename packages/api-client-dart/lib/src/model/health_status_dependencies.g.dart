// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'health_status_dependencies.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HealthStatusDependencies extends HealthStatusDependencies {
  @override
  final DependencyStatus? db;
  @override
  final DependencyStatus? redis;
  @override
  final DependencyStatus? centrifugo;

  factory _$HealthStatusDependencies([
    void Function(HealthStatusDependenciesBuilder)? updates,
  ]) => (HealthStatusDependenciesBuilder()..update(updates))._build();

  _$HealthStatusDependencies._({this.db, this.redis, this.centrifugo})
    : super._();
  @override
  HealthStatusDependencies rebuild(
    void Function(HealthStatusDependenciesBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  HealthStatusDependenciesBuilder toBuilder() =>
      HealthStatusDependenciesBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HealthStatusDependencies &&
        db == other.db &&
        redis == other.redis &&
        centrifugo == other.centrifugo;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, db.hashCode);
    _$hash = $jc(_$hash, redis.hashCode);
    _$hash = $jc(_$hash, centrifugo.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HealthStatusDependencies')
          ..add('db', db)
          ..add('redis', redis)
          ..add('centrifugo', centrifugo))
        .toString();
  }
}

class HealthStatusDependenciesBuilder
    implements
        Builder<HealthStatusDependencies, HealthStatusDependenciesBuilder> {
  _$HealthStatusDependencies? _$v;

  DependencyStatus? _db;
  DependencyStatus? get db => _$this._db;
  set db(DependencyStatus? db) => _$this._db = db;

  DependencyStatus? _redis;
  DependencyStatus? get redis => _$this._redis;
  set redis(DependencyStatus? redis) => _$this._redis = redis;

  DependencyStatus? _centrifugo;
  DependencyStatus? get centrifugo => _$this._centrifugo;
  set centrifugo(DependencyStatus? centrifugo) =>
      _$this._centrifugo = centrifugo;

  HealthStatusDependenciesBuilder() {
    HealthStatusDependencies._defaults(this);
  }

  HealthStatusDependenciesBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _db = $v.db;
      _redis = $v.redis;
      _centrifugo = $v.centrifugo;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HealthStatusDependencies other) {
    _$v = other as _$HealthStatusDependencies;
  }

  @override
  void update(void Function(HealthStatusDependenciesBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HealthStatusDependencies build() => _build();

  _$HealthStatusDependencies _build() {
    final _$result =
        _$v ??
        _$HealthStatusDependencies._(
          db: db,
          redis: redis,
          centrifugo: centrifugo,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

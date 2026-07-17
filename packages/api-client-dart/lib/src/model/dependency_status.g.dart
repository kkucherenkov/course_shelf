// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dependency_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DependencyStatus _$ok = const DependencyStatus._('ok');
const DependencyStatus _$degraded = const DependencyStatus._('degraded');
const DependencyStatus _$down = const DependencyStatus._('down');

DependencyStatus _$valueOf(String name) {
  switch (name) {
    case 'ok':
      return _$ok;
    case 'degraded':
      return _$degraded;
    case 'down':
      return _$down;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DependencyStatus> _$values = BuiltSet<DependencyStatus>(
  const <DependencyStatus>[_$ok, _$degraded, _$down],
);

class _$DependencyStatusMeta {
  const _$DependencyStatusMeta();
  DependencyStatus get ok => _$ok;
  DependencyStatus get degraded => _$degraded;
  DependencyStatus get down => _$down;
  DependencyStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<DependencyStatus> get values => _$values;
}

mixin _$DependencyStatusMixin {
  // ignore: non_constant_identifier_names
  _$DependencyStatusMeta get DependencyStatus => const _$DependencyStatusMeta();
}

Serializer<DependencyStatus> _$dependencyStatusSerializer =
    _$DependencyStatusSerializer();

class _$DependencyStatusSerializer
    implements PrimitiveSerializer<DependencyStatus> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ok': 'ok',
    'degraded': 'degraded',
    'down': 'down',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ok': 'ok',
    'degraded': 'degraded',
    'down': 'down',
  };

  @override
  final Iterable<Type> types = const <Type>[DependencyStatus];
  @override
  final String wireName = 'DependencyStatus';

  @override
  Object serialize(
    Serializers serializers,
    DependencyStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  DependencyStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => DependencyStatus.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

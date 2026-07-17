// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'grant_level.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const GrantLevel _$READ = const GrantLevel._('READ');

GrantLevel _$valueOf(String name) {
  switch (name) {
    case 'READ':
      return _$READ;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<GrantLevel> _$values = BuiltSet<GrantLevel>(const <GrantLevel>[
  _$READ,
]);

class _$GrantLevelMeta {
  const _$GrantLevelMeta();
  GrantLevel get READ => _$READ;
  GrantLevel valueOf(String name) => _$valueOf(name);
  BuiltSet<GrantLevel> get values => _$values;
}

mixin _$GrantLevelMixin {
  // ignore: non_constant_identifier_names
  _$GrantLevelMeta get GrantLevel => const _$GrantLevelMeta();
}

Serializer<GrantLevel> _$grantLevelSerializer = _$GrantLevelSerializer();

class _$GrantLevelSerializer implements PrimitiveSerializer<GrantLevel> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'READ': 'READ',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'READ': 'READ',
  };

  @override
  final Iterable<Type> types = const <Type>[GrantLevel];
  @override
  final String wireName = 'GrantLevel';

  @override
  Object serialize(
    Serializers serializers,
    GrantLevel object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  GrantLevel deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => GrantLevel.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

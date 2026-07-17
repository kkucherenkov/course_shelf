// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'merge_mode.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MergeMode _$merge = const MergeMode._('merge');
const MergeMode _$overwrite = const MergeMode._('overwrite');
const MergeMode _$ignore = const MergeMode._('ignore');

MergeMode _$valueOf(String name) {
  switch (name) {
    case 'merge':
      return _$merge;
    case 'overwrite':
      return _$overwrite;
    case 'ignore':
      return _$ignore;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MergeMode> _$values = BuiltSet<MergeMode>(const <MergeMode>[
  _$merge,
  _$overwrite,
  _$ignore,
]);

class _$MergeModeMeta {
  const _$MergeModeMeta();
  MergeMode get merge => _$merge;
  MergeMode get overwrite => _$overwrite;
  MergeMode get ignore => _$ignore;
  MergeMode valueOf(String name) => _$valueOf(name);
  BuiltSet<MergeMode> get values => _$values;
}

mixin _$MergeModeMixin {
  // ignore: non_constant_identifier_names
  _$MergeModeMeta get MergeMode => const _$MergeModeMeta();
}

Serializer<MergeMode> _$mergeModeSerializer = _$MergeModeSerializer();

class _$MergeModeSerializer implements PrimitiveSerializer<MergeMode> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'merge': 'merge',
    'overwrite': 'overwrite',
    'ignore': 'ignore',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'merge': 'merge',
    'overwrite': 'overwrite',
    'ignore': 'ignore',
  };

  @override
  final Iterable<Type> types = const <Type>[MergeMode];
  @override
  final String wireName = 'MergeMode';

  @override
  Object serialize(
    Serializers serializers,
    MergeMode object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  MergeMode deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => MergeMode.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

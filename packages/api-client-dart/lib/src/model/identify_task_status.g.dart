// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'identify_task_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const IdentifyTaskStatus _$proposed = const IdentifyTaskStatus._('proposed');
const IdentifyTaskStatus _$applied = const IdentifyTaskStatus._('applied');
const IdentifyTaskStatus _$discarded = const IdentifyTaskStatus._('discarded');

IdentifyTaskStatus _$valueOf(String name) {
  switch (name) {
    case 'proposed':
      return _$proposed;
    case 'applied':
      return _$applied;
    case 'discarded':
      return _$discarded;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<IdentifyTaskStatus> _$values = BuiltSet<IdentifyTaskStatus>(
  const <IdentifyTaskStatus>[_$proposed, _$applied, _$discarded],
);

class _$IdentifyTaskStatusMeta {
  const _$IdentifyTaskStatusMeta();
  IdentifyTaskStatus get proposed => _$proposed;
  IdentifyTaskStatus get applied => _$applied;
  IdentifyTaskStatus get discarded => _$discarded;
  IdentifyTaskStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<IdentifyTaskStatus> get values => _$values;
}

mixin _$IdentifyTaskStatusMixin {
  // ignore: non_constant_identifier_names
  _$IdentifyTaskStatusMeta get IdentifyTaskStatus =>
      const _$IdentifyTaskStatusMeta();
}

Serializer<IdentifyTaskStatus> _$identifyTaskStatusSerializer =
    _$IdentifyTaskStatusSerializer();

class _$IdentifyTaskStatusSerializer
    implements PrimitiveSerializer<IdentifyTaskStatus> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'proposed': 'proposed',
    'applied': 'applied',
    'discarded': 'discarded',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'proposed': 'proposed',
    'applied': 'applied',
    'discarded': 'discarded',
  };

  @override
  final Iterable<Type> types = const <Type>[IdentifyTaskStatus];
  @override
  final String wireName = 'IdentifyTaskStatus';

  @override
  Object serialize(
    Serializers serializers,
    IdentifyTaskStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  IdentifyTaskStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => IdentifyTaskStatus.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

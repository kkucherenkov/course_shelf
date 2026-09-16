// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quiz_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const QuizStatus _$proposed = const QuizStatus._('proposed');
const QuizStatus _$applied = const QuizStatus._('applied');
const QuizStatus _$discarded = const QuizStatus._('discarded');

QuizStatus _$valueOf(String name) {
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

final BuiltSet<QuizStatus> _$values = BuiltSet<QuizStatus>(const <QuizStatus>[
  _$proposed,
  _$applied,
  _$discarded,
]);

class _$QuizStatusMeta {
  const _$QuizStatusMeta();
  QuizStatus get proposed => _$proposed;
  QuizStatus get applied => _$applied;
  QuizStatus get discarded => _$discarded;
  QuizStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<QuizStatus> get values => _$values;
}

mixin _$QuizStatusMixin {
  // ignore: non_constant_identifier_names
  _$QuizStatusMeta get QuizStatus => const _$QuizStatusMeta();
}

Serializer<QuizStatus> _$quizStatusSerializer = _$QuizStatusSerializer();

class _$QuizStatusSerializer implements PrimitiveSerializer<QuizStatus> {
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
  final Iterable<Type> types = const <Type>[QuizStatus];
  @override
  final String wireName = 'QuizStatus';

  @override
  Object serialize(
    Serializers serializers,
    QuizStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  QuizStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => QuizStatus.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

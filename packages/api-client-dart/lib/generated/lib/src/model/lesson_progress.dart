//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lesson_progress.g.dart';

/// Per-lesson playback progress for the requesting user.
///
/// Properties:
/// * [percent] - Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
/// * [completed] - Whether the lesson is marked as completed.
/// * [lastSeenAtSeconds] - Last reported watched position in seconds. v1 always returns 0 — populated by the LessonProgress projector (E10-F01-S01).
@BuiltValue()
abstract class LessonProgress implements Built<LessonProgress, LessonProgressBuilder> {
  /// Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
  @BuiltValueField(wireName: r'percent')
  num get percent;

  /// Whether the lesson is marked as completed.
  @BuiltValueField(wireName: r'completed')
  bool get completed;

  /// Last reported watched position in seconds. v1 always returns 0 — populated by the LessonProgress projector (E10-F01-S01).
  @BuiltValueField(wireName: r'lastSeenAtSeconds')
  int get lastSeenAtSeconds;

  LessonProgress._();

  factory LessonProgress([void updates(LessonProgressBuilder b)]) = _$LessonProgress;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LessonProgressBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LessonProgress> get serializer => _$LessonProgressSerializer();
}

class _$LessonProgressSerializer implements PrimitiveSerializer<LessonProgress> {
  @override
  final Iterable<Type> types = const [LessonProgress, _$LessonProgress];

  @override
  final String wireName = r'LessonProgress';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LessonProgress object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'percent';
    yield serializers.serialize(
      object.percent,
      specifiedType: const FullType(num),
    );
    yield r'completed';
    yield serializers.serialize(
      object.completed,
      specifiedType: const FullType(bool),
    );
    yield r'lastSeenAtSeconds';
    yield serializers.serialize(
      object.lastSeenAtSeconds,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LessonProgress object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LessonProgressBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'percent':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.percent = valueDes;
          break;
        case r'completed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.completed = valueDes;
          break;
        case r'lastSeenAtSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lastSeenAtSeconds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LessonProgress deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LessonProgressBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}


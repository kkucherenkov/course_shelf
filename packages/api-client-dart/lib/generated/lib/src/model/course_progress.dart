//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_progress.g.dart';

/// Progress summary for a course from the requester's perspective.
///
/// Properties:
/// * [percent] - Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
/// * [lessonsCompleted] 
/// * [lessonsTotal] 
@BuiltValue()
abstract class CourseProgress implements Built<CourseProgress, CourseProgressBuilder> {
  /// Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
  @BuiltValueField(wireName: r'percent')
  num get percent;

  @BuiltValueField(wireName: r'lessonsCompleted')
  int get lessonsCompleted;

  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  CourseProgress._();

  factory CourseProgress([void updates(CourseProgressBuilder b)]) = _$CourseProgress;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseProgressBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseProgress> get serializer => _$CourseProgressSerializer();
}

class _$CourseProgressSerializer implements PrimitiveSerializer<CourseProgress> {
  @override
  final Iterable<Type> types = const [CourseProgress, _$CourseProgress];

  @override
  final String wireName = r'CourseProgress';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseProgress object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'percent';
    yield serializers.serialize(
      object.percent,
      specifiedType: const FullType(num),
    );
    yield r'lessonsCompleted';
    yield serializers.serialize(
      object.lessonsCompleted,
      specifiedType: const FullType(int),
    );
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseProgress object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseProgressBuilder result,
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
        case r'lessonsCompleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsCompleted = valueDes;
          break;
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseProgress deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseProgressBuilder();
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


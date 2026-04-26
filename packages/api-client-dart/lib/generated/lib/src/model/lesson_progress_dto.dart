//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lesson_progress_dto.g.dart';

/// Per-user progress state for a single lesson, as persisted after a merge.
///
/// Properties:
/// * [lessonId] - Server-generated cuid identifying the lesson.
/// * [positionSeconds] - Last recorded watch position in seconds.
/// * [durationSeconds] - Lesson video duration in seconds.
/// * [percent] - Computed as `positionSeconds / durationSeconds * 100`. Clamped to 100 when position >= duration.
/// * [completed] - True once the user crosses the 90 % threshold; never flips back to false.
/// * [lastSeenAt] - ISO-8601 instant of the last accepted progress write.
/// * [completedAt] - Set the first time `completed` flips to true. Stable across subsequent writes. Absent when `completed` is false.
@BuiltValue()
abstract class LessonProgressDto implements Built<LessonProgressDto, LessonProgressDtoBuilder> {
  /// Server-generated cuid identifying the lesson.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Last recorded watch position in seconds.
  @BuiltValueField(wireName: r'positionSeconds')
  int get positionSeconds;

  /// Lesson video duration in seconds.
  @BuiltValueField(wireName: r'durationSeconds')
  int get durationSeconds;

  /// Computed as `positionSeconds / durationSeconds * 100`. Clamped to 100 when position >= duration.
  @BuiltValueField(wireName: r'percent')
  num get percent;

  /// True once the user crosses the 90 % threshold; never flips back to false.
  @BuiltValueField(wireName: r'completed')
  bool get completed;

  /// ISO-8601 instant of the last accepted progress write.
  @BuiltValueField(wireName: r'lastSeenAt')
  DateTime get lastSeenAt;

  /// Set the first time `completed` flips to true. Stable across subsequent writes. Absent when `completed` is false.
  @BuiltValueField(wireName: r'completedAt')
  DateTime? get completedAt;

  LessonProgressDto._();

  factory LessonProgressDto([void updates(LessonProgressDtoBuilder b)]) = _$LessonProgressDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LessonProgressDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LessonProgressDto> get serializer => _$LessonProgressDtoSerializer();
}

class _$LessonProgressDtoSerializer implements PrimitiveSerializer<LessonProgressDto> {
  @override
  final Iterable<Type> types = const [LessonProgressDto, _$LessonProgressDto];

  @override
  final String wireName = r'LessonProgressDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LessonProgressDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'positionSeconds';
    yield serializers.serialize(
      object.positionSeconds,
      specifiedType: const FullType(int),
    );
    yield r'durationSeconds';
    yield serializers.serialize(
      object.durationSeconds,
      specifiedType: const FullType(int),
    );
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
    yield r'lastSeenAt';
    yield serializers.serialize(
      object.lastSeenAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.completedAt != null) {
      yield r'completedAt';
      yield serializers.serialize(
        object.completedAt,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LessonProgressDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LessonProgressDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'positionSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.positionSeconds = valueDes;
          break;
        case r'durationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.durationSeconds = valueDes;
          break;
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
        case r'lastSeenAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.lastSeenAt = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.completedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LessonProgressDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LessonProgressDtoBuilder();
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


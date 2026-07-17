//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_target.g.dart';

/// CourseTarget
///
/// Properties:
/// * [kind] - Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
/// * [courseId] - Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
@BuiltValue()
abstract class CourseTarget implements Built<CourseTarget, CourseTargetBuilder> {
  /// Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
  @BuiltValueField(wireName: r'kind')
  CourseTargetKindEnum get kind;
  // enum kindEnum {  course,  };

  /// Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  CourseTarget._();

  factory CourseTarget([void updates(CourseTargetBuilder b)]) = _$CourseTarget;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseTargetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseTarget> get serializer => _$CourseTargetSerializer();
}

class _$CourseTargetSerializer implements PrimitiveSerializer<CourseTarget> {
  @override
  final Iterable<Type> types = const [CourseTarget, _$CourseTarget];

  @override
  final String wireName = r'CourseTarget';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(CourseTargetKindEnum),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseTargetBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseTargetKindEnum),
          ) as CourseTargetKindEnum;
          result.kind = valueDes;
          break;
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseTarget deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseTargetBuilder();
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

class CourseTargetKindEnum extends EnumClass {

  /// Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
  @BuiltValueEnumConst(wireName: r'course')
  static const CourseTargetKindEnum course = _$courseTargetKindEnum_course;

  static Serializer<CourseTargetKindEnum> get serializer => _$courseTargetKindEnumSerializer;

  const CourseTargetKindEnum._(String name): super(name);

  static BuiltSet<CourseTargetKindEnum> get values => _$courseTargetKindEnumValues;
  static CourseTargetKindEnum valueOf(String name) => _$courseTargetKindEnumValueOf(name);
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/lesson_outline_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'section_outline.g.dart';

/// One section in the outline, with its lesson list inline.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this section.
/// * [position] - 1-based position within the course.
/// * [title] 
/// * [totalDurationSeconds] - Sum of `Lesson.duration` across this section's lessons.
/// * [lessons] - Lessons sorted by position.
@BuiltValue()
abstract class SectionOutline implements Built<SectionOutline, SectionOutlineBuilder> {
  /// Server-generated cuid identifying this section.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// 1-based position within the course.
  @BuiltValueField(wireName: r'position')
  int get position;

  @BuiltValueField(wireName: r'title')
  String get title;

  /// Sum of `Lesson.duration` across this section's lessons.
  @BuiltValueField(wireName: r'totalDurationSeconds')
  int get totalDurationSeconds;

  /// Lessons sorted by position.
  @BuiltValueField(wireName: r'lessons')
  BuiltList<LessonOutlineItem> get lessons;

  SectionOutline._();

  factory SectionOutline([void updates(SectionOutlineBuilder b)]) = _$SectionOutline;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SectionOutlineBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SectionOutline> get serializer => _$SectionOutlineSerializer();
}

class _$SectionOutlineSerializer implements PrimitiveSerializer<SectionOutline> {
  @override
  final Iterable<Type> types = const [SectionOutline, _$SectionOutline];

  @override
  final String wireName = r'SectionOutline';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SectionOutline object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(int),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'totalDurationSeconds';
    yield serializers.serialize(
      object.totalDurationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'lessons';
    yield serializers.serialize(
      object.lessons,
      specifiedType: const FullType(BuiltList, [FullType(LessonOutlineItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SectionOutline object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SectionOutlineBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.position = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'totalDurationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalDurationSeconds = valueDes;
          break;
        case r'lessons':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LessonOutlineItem)]),
          ) as BuiltList<LessonOutlineItem>;
          result.lessons.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SectionOutline deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SectionOutlineBuilder();
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


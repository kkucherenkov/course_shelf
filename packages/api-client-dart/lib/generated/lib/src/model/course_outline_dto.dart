//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/course_outline_summary.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/section_outline.dart';
import 'package:app_api_client/src/model/course_material_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_outline_dto.g.dart';

/// Page-shaped projection of a course — enough data to render the Course detail screen in one round-trip. Aggregates sections, lessons (lite), and course-level materials with the requester's progress applied.
///
/// Properties:
/// * [course] 
/// * [sections] - Sections sorted by position.
/// * [materials] - Course-level materials, deduplicated and aggregated across every lesson in the course. Empty array when no lesson carries materials.
@BuiltValue()
abstract class CourseOutlineDto implements Built<CourseOutlineDto, CourseOutlineDtoBuilder> {
  @BuiltValueField(wireName: r'course')
  CourseOutlineSummary get course;

  /// Sections sorted by position.
  @BuiltValueField(wireName: r'sections')
  BuiltList<SectionOutline> get sections;

  /// Course-level materials, deduplicated and aggregated across every lesson in the course. Empty array when no lesson carries materials.
  @BuiltValueField(wireName: r'materials')
  BuiltList<CourseMaterialItem> get materials;

  CourseOutlineDto._();

  factory CourseOutlineDto([void updates(CourseOutlineDtoBuilder b)]) = _$CourseOutlineDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseOutlineDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseOutlineDto> get serializer => _$CourseOutlineDtoSerializer();
}

class _$CourseOutlineDtoSerializer implements PrimitiveSerializer<CourseOutlineDto> {
  @override
  final Iterable<Type> types = const [CourseOutlineDto, _$CourseOutlineDto];

  @override
  final String wireName = r'CourseOutlineDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseOutlineDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'course';
    yield serializers.serialize(
      object.course,
      specifiedType: const FullType(CourseOutlineSummary),
    );
    yield r'sections';
    yield serializers.serialize(
      object.sections,
      specifiedType: const FullType(BuiltList, [FullType(SectionOutline)]),
    );
    yield r'materials';
    yield serializers.serialize(
      object.materials,
      specifiedType: const FullType(BuiltList, [FullType(CourseMaterialItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseOutlineDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseOutlineDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'course':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseOutlineSummary),
          ) as CourseOutlineSummary;
          result.course.replace(valueDes);
          break;
        case r'sections':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SectionOutline)]),
          ) as BuiltList<SectionOutline>;
          result.sections.replace(valueDes);
          break;
        case r'materials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(CourseMaterialItem)]),
          ) as BuiltList<CourseMaterialItem>;
          result.materials.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseOutlineDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseOutlineDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/tag_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_detail_dto.g.dart';

/// Full tag view including associated courses (paginated, up to 20).
///
/// Properties:
/// * [tag] 
/// * [courses] - Courses associated with this tag, up to 20, sorted by title.
/// * [coursesTotal] - Total number of courses associated with this tag (may exceed `courses.length`).
@BuiltValue()
abstract class TagDetailDto implements Built<TagDetailDto, TagDetailDtoBuilder> {
  @BuiltValueField(wireName: r'tag')
  TagDto get tag;

  /// Courses associated with this tag, up to 20, sorted by title.
  @BuiltValueField(wireName: r'courses')
  BuiltList<CourseDto> get courses;

  /// Total number of courses associated with this tag (may exceed `courses.length`).
  @BuiltValueField(wireName: r'coursesTotal')
  int get coursesTotal;

  TagDetailDto._();

  factory TagDetailDto([void updates(TagDetailDtoBuilder b)]) = _$TagDetailDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagDetailDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagDetailDto> get serializer => _$TagDetailDtoSerializer();
}

class _$TagDetailDtoSerializer implements PrimitiveSerializer<TagDetailDto> {
  @override
  final Iterable<Type> types = const [TagDetailDto, _$TagDetailDto];

  @override
  final String wireName = r'TagDetailDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tag';
    yield serializers.serialize(
      object.tag,
      specifiedType: const FullType(TagDto),
    );
    yield r'courses';
    yield serializers.serialize(
      object.courses,
      specifiedType: const FullType(BuiltList, [FullType(CourseDto)]),
    );
    yield r'coursesTotal';
    yield serializers.serialize(
      object.coursesTotal,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TagDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagDetailDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tag':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TagDto),
          ) as TagDto;
          result.tag.replace(valueDes);
          break;
        case r'courses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(CourseDto)]),
          ) as BuiltList<CourseDto>;
          result.courses.replace(valueDes);
          break;
        case r'coursesTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.coursesTotal = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TagDetailDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagDetailDtoBuilder();
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


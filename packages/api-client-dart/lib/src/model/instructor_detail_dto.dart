//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/instructor_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'instructor_detail_dto.g.dart';

/// Full instructor view including their associated courses (paginated, up to 20).
///
/// Properties:
/// * [instructor] 
/// * [courses] - Courses associated with this instructor, up to 20, sorted by title.
/// * [coursesTotal] - Total number of courses associated with this instructor (may exceed `courses.length`).
@BuiltValue()
abstract class InstructorDetailDto implements Built<InstructorDetailDto, InstructorDetailDtoBuilder> {
  @BuiltValueField(wireName: r'instructor')
  InstructorDto get instructor;

  /// Courses associated with this instructor, up to 20, sorted by title.
  @BuiltValueField(wireName: r'courses')
  BuiltList<CourseDto> get courses;

  /// Total number of courses associated with this instructor (may exceed `courses.length`).
  @BuiltValueField(wireName: r'coursesTotal')
  int get coursesTotal;

  InstructorDetailDto._();

  factory InstructorDetailDto([void updates(InstructorDetailDtoBuilder b)]) = _$InstructorDetailDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstructorDetailDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstructorDetailDto> get serializer => _$InstructorDetailDtoSerializer();
}

class _$InstructorDetailDtoSerializer implements PrimitiveSerializer<InstructorDetailDto> {
  @override
  final Iterable<Type> types = const [InstructorDetailDto, _$InstructorDetailDto];

  @override
  final String wireName = r'InstructorDetailDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstructorDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'instructor';
    yield serializers.serialize(
      object.instructor,
      specifiedType: const FullType(InstructorDto),
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
    InstructorDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstructorDetailDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'instructor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(InstructorDto),
          ) as InstructorDto;
          result.instructor.replace(valueDes);
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
  InstructorDetailDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstructorDetailDtoBuilder();
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


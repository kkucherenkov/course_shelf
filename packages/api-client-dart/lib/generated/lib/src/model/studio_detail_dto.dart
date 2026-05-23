//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:app_api_client/src/model/studio_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'studio_detail_dto.g.dart';

/// Full studio view including their associated courses (paginated, up to 20).
///
/// Properties:
/// * [studio] 
/// * [courses] - Courses associated with this studio, up to 20, sorted by title.
/// * [coursesTotal] - Total number of courses associated with this studio (may exceed `courses.length`).
@BuiltValue()
abstract class StudioDetailDto implements Built<StudioDetailDto, StudioDetailDtoBuilder> {
  @BuiltValueField(wireName: r'studio')
  StudioDto get studio;

  /// Courses associated with this studio, up to 20, sorted by title.
  @BuiltValueField(wireName: r'courses')
  BuiltList<CourseDto> get courses;

  /// Total number of courses associated with this studio (may exceed `courses.length`).
  @BuiltValueField(wireName: r'coursesTotal')
  int get coursesTotal;

  StudioDetailDto._();

  factory StudioDetailDto([void updates(StudioDetailDtoBuilder b)]) = _$StudioDetailDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StudioDetailDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StudioDetailDto> get serializer => _$StudioDetailDtoSerializer();
}

class _$StudioDetailDtoSerializer implements PrimitiveSerializer<StudioDetailDto> {
  @override
  final Iterable<Type> types = const [StudioDetailDto, _$StudioDetailDto];

  @override
  final String wireName = r'StudioDetailDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StudioDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'studio';
    yield serializers.serialize(
      object.studio,
      specifiedType: const FullType(StudioDto),
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
    StudioDetailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StudioDetailDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'studio':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(StudioDto),
          ) as StudioDto;
          result.studio.replace(valueDes);
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
  StudioDetailDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StudioDetailDtoBuilder();
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


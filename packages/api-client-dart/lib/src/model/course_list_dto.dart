//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_list_dto.g.dart';

/// List of courses visible to the requester.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class CourseListDto implements Built<CourseListDto, CourseListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<CourseDto> get items;

  CourseListDto._();

  factory CourseListDto([void updates(CourseListDtoBuilder b)]) = _$CourseListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseListDto> get serializer => _$CourseListDtoSerializer();
}

class _$CourseListDtoSerializer implements PrimitiveSerializer<CourseListDto> {
  @override
  final Iterable<Type> types = const [CourseListDto, _$CourseListDto];

  @override
  final String wireName = r'CourseListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(CourseDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(CourseDto)]),
          ) as BuiltList<CourseDto>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseListDtoBuilder();
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


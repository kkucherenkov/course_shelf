//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/instructor_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'instructor_list_dto.g.dart';

/// Paginated list of instructors.
///
/// Properties:
/// * [items] 
/// * [total] - Total number of instructors matching the filter (before pagination).
/// * [offset] - Number of items skipped.
/// * [limit] - Maximum items returned per page.
@BuiltValue()
abstract class InstructorListDto implements Built<InstructorListDto, InstructorListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<InstructorDto> get items;

  /// Total number of instructors matching the filter (before pagination).
  @BuiltValueField(wireName: r'total')
  int get total;

  /// Number of items skipped.
  @BuiltValueField(wireName: r'offset')
  int get offset;

  /// Maximum items returned per page.
  @BuiltValueField(wireName: r'limit')
  int get limit;

  InstructorListDto._();

  factory InstructorListDto([void updates(InstructorListDtoBuilder b)]) = _$InstructorListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstructorListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstructorListDto> get serializer => _$InstructorListDtoSerializer();
}

class _$InstructorListDtoSerializer implements PrimitiveSerializer<InstructorListDto> {
  @override
  final Iterable<Type> types = const [InstructorListDto, _$InstructorListDto];

  @override
  final String wireName = r'InstructorListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstructorListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(InstructorDto)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
    yield r'offset';
    yield serializers.serialize(
      object.offset,
      specifiedType: const FullType(int),
    );
    yield r'limit';
    yield serializers.serialize(
      object.limit,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    InstructorListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstructorListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(InstructorDto)]),
          ) as BuiltList<InstructorDto>;
          result.items.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        case r'offset':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.offset = valueDes;
          break;
        case r'limit':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.limit = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InstructorListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstructorListDtoBuilder();
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


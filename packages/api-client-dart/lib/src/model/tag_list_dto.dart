//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/tag_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_list_dto.g.dart';

/// Paginated list of tags.
///
/// Properties:
/// * [items] 
/// * [total] - Total number of tags matching the filter (before pagination).
/// * [offset] - Number of items skipped.
/// * [limit] - Maximum items returned per page.
@BuiltValue()
abstract class TagListDto implements Built<TagListDto, TagListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<TagDto> get items;

  /// Total number of tags matching the filter (before pagination).
  @BuiltValueField(wireName: r'total')
  int get total;

  /// Number of items skipped.
  @BuiltValueField(wireName: r'offset')
  int get offset;

  /// Maximum items returned per page.
  @BuiltValueField(wireName: r'limit')
  int get limit;

  TagListDto._();

  factory TagListDto([void updates(TagListDtoBuilder b)]) = _$TagListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagListDto> get serializer => _$TagListDtoSerializer();
}

class _$TagListDtoSerializer implements PrimitiveSerializer<TagListDto> {
  @override
  final Iterable<Type> types = const [TagListDto, _$TagListDto];

  @override
  final String wireName = r'TagListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(TagDto)]),
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
    TagListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(TagDto)]),
          ) as BuiltList<TagDto>;
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
  TagListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagListDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/recently_added_item.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recently_added_dto.g.dart';

/// Courses added to the requester's libraries, most recent first.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class RecentlyAddedDto implements Built<RecentlyAddedDto, RecentlyAddedDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<RecentlyAddedItem> get items;

  RecentlyAddedDto._();

  factory RecentlyAddedDto([void updates(RecentlyAddedDtoBuilder b)]) = _$RecentlyAddedDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentlyAddedDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentlyAddedDto> get serializer => _$RecentlyAddedDtoSerializer();
}

class _$RecentlyAddedDtoSerializer implements PrimitiveSerializer<RecentlyAddedDto> {
  @override
  final Iterable<Type> types = const [RecentlyAddedDto, _$RecentlyAddedDto];

  @override
  final String wireName = r'RecentlyAddedDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentlyAddedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(RecentlyAddedItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentlyAddedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentlyAddedDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RecentlyAddedItem)]),
          ) as BuiltList<RecentlyAddedItem>;
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
  RecentlyAddedDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentlyAddedDtoBuilder();
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


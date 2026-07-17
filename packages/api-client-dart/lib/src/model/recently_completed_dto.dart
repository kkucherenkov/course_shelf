//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/recently_completed_item.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recently_completed_dto.g.dart';

/// Courses the requester finished most recently, most-recent first.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class RecentlyCompletedDto implements Built<RecentlyCompletedDto, RecentlyCompletedDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<RecentlyCompletedItem> get items;

  RecentlyCompletedDto._();

  factory RecentlyCompletedDto([void updates(RecentlyCompletedDtoBuilder b)]) = _$RecentlyCompletedDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentlyCompletedDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentlyCompletedDto> get serializer => _$RecentlyCompletedDtoSerializer();
}

class _$RecentlyCompletedDtoSerializer implements PrimitiveSerializer<RecentlyCompletedDto> {
  @override
  final Iterable<Type> types = const [RecentlyCompletedDto, _$RecentlyCompletedDto];

  @override
  final String wireName = r'RecentlyCompletedDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentlyCompletedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(RecentlyCompletedItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentlyCompletedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentlyCompletedDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RecentlyCompletedItem)]),
          ) as BuiltList<RecentlyCompletedItem>;
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
  RecentlyCompletedDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentlyCompletedDtoBuilder();
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


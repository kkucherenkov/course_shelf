//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/access_grant_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'access_grant_list_dto.g.dart';

/// Paginated list of access grants for a given user.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AccessGrantListDto implements Built<AccessGrantListDto, AccessGrantListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AccessGrantDto> get items;

  AccessGrantListDto._();

  factory AccessGrantListDto([void updates(AccessGrantListDtoBuilder b)]) = _$AccessGrantListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AccessGrantListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AccessGrantListDto> get serializer => _$AccessGrantListDtoSerializer();
}

class _$AccessGrantListDtoSerializer implements PrimitiveSerializer<AccessGrantListDto> {
  @override
  final Iterable<Type> types = const [AccessGrantListDto, _$AccessGrantListDto];

  @override
  final String wireName = r'AccessGrantListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AccessGrantListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AccessGrantDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AccessGrantListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AccessGrantListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AccessGrantDto)]),
          ) as BuiltList<AccessGrantDto>;
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
  AccessGrantListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AccessGrantListDtoBuilder();
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


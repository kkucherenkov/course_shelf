//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_user_list_item.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_user_list_dto.g.dart';

/// Admin-only listing of every user in the platform. The admin users page renders one `AdminUserListItem` per row.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AdminUserListDto implements Built<AdminUserListDto, AdminUserListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminUserListItem> get items;

  AdminUserListDto._();

  factory AdminUserListDto([void updates(AdminUserListDtoBuilder b)]) = _$AdminUserListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUserListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUserListDto> get serializer => _$AdminUserListDtoSerializer();
}

class _$AdminUserListDtoSerializer implements PrimitiveSerializer<AdminUserListDto> {
  @override
  final Iterable<Type> types = const [AdminUserListDto, _$AdminUserListDto];

  @override
  final String wireName = r'AdminUserListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUserListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminUserListItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminUserListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminUserListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminUserListItem)]),
          ) as BuiltList<AdminUserListItem>;
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
  AdminUserListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUserListDtoBuilder();
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


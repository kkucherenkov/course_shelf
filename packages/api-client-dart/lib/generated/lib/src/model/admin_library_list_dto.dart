//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_library_list_item.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_library_list_dto.g.dart';

/// Admin-only listing of every library with the counters and last-scan summary the admin libraries page renders per row.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AdminLibraryListDto implements Built<AdminLibraryListDto, AdminLibraryListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminLibraryListItem> get items;

  AdminLibraryListDto._();

  factory AdminLibraryListDto([void updates(AdminLibraryListDtoBuilder b)]) = _$AdminLibraryListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminLibraryListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminLibraryListDto> get serializer => _$AdminLibraryListDtoSerializer();
}

class _$AdminLibraryListDtoSerializer implements PrimitiveSerializer<AdminLibraryListDto> {
  @override
  final Iterable<Type> types = const [AdminLibraryListDto, _$AdminLibraryListDto];

  @override
  final String wireName = r'AdminLibraryListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminLibraryListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminLibraryListItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminLibraryListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminLibraryListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminLibraryListItem)]),
          ) as BuiltList<AdminLibraryListItem>;
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
  AdminLibraryListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminLibraryListDtoBuilder();
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


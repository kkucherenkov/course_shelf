//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_scan_list_item.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_scan_list_dto.g.dart';

/// Page of recent scans across every library, ordered by `startedAt` descending. The dashboard's \"Recent scans\" table consumes this.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AdminScanListDto implements Built<AdminScanListDto, AdminScanListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminScanListItem> get items;

  AdminScanListDto._();

  factory AdminScanListDto([void updates(AdminScanListDtoBuilder b)]) = _$AdminScanListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminScanListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminScanListDto> get serializer => _$AdminScanListDtoSerializer();
}

class _$AdminScanListDtoSerializer implements PrimitiveSerializer<AdminScanListDto> {
  @override
  final Iterable<Type> types = const [AdminScanListDto, _$AdminScanListDto];

  @override
  final String wireName = r'AdminScanListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminScanListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminScanListItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminScanListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminScanListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminScanListItem)]),
          ) as BuiltList<AdminScanListItem>;
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
  AdminScanListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminScanListDtoBuilder();
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


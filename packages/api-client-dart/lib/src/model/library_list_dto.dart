//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/library_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_list_dto.g.dart';

/// LibraryListDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class LibraryListDto implements Built<LibraryListDto, LibraryListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<LibraryDto> get items;

  LibraryListDto._();

  factory LibraryListDto([void updates(LibraryListDtoBuilder b)]) = _$LibraryListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryListDto> get serializer => _$LibraryListDtoSerializer();
}

class _$LibraryListDtoSerializer implements PrimitiveSerializer<LibraryListDto> {
  @override
  final Iterable<Type> types = const [LibraryListDto, _$LibraryListDto];

  @override
  final String wireName = r'LibraryListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(LibraryDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LibraryDto)]),
          ) as BuiltList<LibraryDto>;
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
  LibraryListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryListDtoBuilder();
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


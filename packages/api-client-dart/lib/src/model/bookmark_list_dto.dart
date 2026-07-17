//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/bookmark_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'bookmark_list_dto.g.dart';

/// The requesting user's bookmarks for a single lesson, sorted ascending by `positionSeconds`.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class BookmarkListDto implements Built<BookmarkListDto, BookmarkListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<BookmarkDto> get items;

  BookmarkListDto._();

  factory BookmarkListDto([void updates(BookmarkListDtoBuilder b)]) = _$BookmarkListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BookmarkListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BookmarkListDto> get serializer => _$BookmarkListDtoSerializer();
}

class _$BookmarkListDtoSerializer implements PrimitiveSerializer<BookmarkListDto> {
  @override
  final Iterable<Type> types = const [BookmarkListDto, _$BookmarkListDto];

  @override
  final String wireName = r'BookmarkListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BookmarkListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(BookmarkDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BookmarkListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BookmarkListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(BookmarkDto)]),
          ) as BuiltList<BookmarkDto>;
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
  BookmarkListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BookmarkListDtoBuilder();
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


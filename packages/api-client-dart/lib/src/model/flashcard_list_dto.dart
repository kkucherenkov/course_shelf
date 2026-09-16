//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/flashcard_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'flashcard_list_dto.g.dart';

/// A list of the requester's flashcards.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class FlashcardListDto implements Built<FlashcardListDto, FlashcardListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<FlashcardDto> get items;

  FlashcardListDto._();

  factory FlashcardListDto([void updates(FlashcardListDtoBuilder b)]) = _$FlashcardListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FlashcardListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FlashcardListDto> get serializer => _$FlashcardListDtoSerializer();
}

class _$FlashcardListDtoSerializer implements PrimitiveSerializer<FlashcardListDto> {
  @override
  final Iterable<Type> types = const [FlashcardListDto, _$FlashcardListDto];

  @override
  final String wireName = r'FlashcardListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FlashcardListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(FlashcardDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FlashcardListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FlashcardListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(FlashcardDto)]),
          ) as BuiltList<FlashcardDto>;
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
  FlashcardListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FlashcardListDtoBuilder();
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


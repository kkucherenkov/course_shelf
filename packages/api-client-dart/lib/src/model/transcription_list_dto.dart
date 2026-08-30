//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/transcription_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcription_list_dto.g.dart';

/// Transcription runs ordered by `startedAt` descending (newest first). Used both for a single library's history and for the cross-library admin list.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class TranscriptionListDto implements Built<TranscriptionListDto, TranscriptionListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<TranscriptionDto> get items;

  TranscriptionListDto._();

  factory TranscriptionListDto([void updates(TranscriptionListDtoBuilder b)]) = _$TranscriptionListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TranscriptionListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TranscriptionListDto> get serializer => _$TranscriptionListDtoSerializer();
}

class _$TranscriptionListDtoSerializer implements PrimitiveSerializer<TranscriptionListDto> {
  @override
  final Iterable<Type> types = const [TranscriptionListDto, _$TranscriptionListDto];

  @override
  final String wireName = r'TranscriptionListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TranscriptionListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(TranscriptionDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TranscriptionListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TranscriptionListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(TranscriptionDto)]),
          ) as BuiltList<TranscriptionDto>;
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
  TranscriptionListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TranscriptionListDtoBuilder();
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


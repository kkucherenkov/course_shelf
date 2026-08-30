//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/admin_transcription_list_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_transcription_list_dto.g.dart';

/// Page of recent transcription runs across every library, ordered by `startedAt` descending. The admin transcription table consumes this.
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AdminTranscriptionListDto implements Built<AdminTranscriptionListDto, AdminTranscriptionListDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminTranscriptionListItem> get items;

  AdminTranscriptionListDto._();

  factory AdminTranscriptionListDto([void updates(AdminTranscriptionListDtoBuilder b)]) = _$AdminTranscriptionListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminTranscriptionListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminTranscriptionListDto> get serializer => _$AdminTranscriptionListDtoSerializer();
}

class _$AdminTranscriptionListDtoSerializer implements PrimitiveSerializer<AdminTranscriptionListDto> {
  @override
  final Iterable<Type> types = const [AdminTranscriptionListDto, _$AdminTranscriptionListDto];

  @override
  final String wireName = r'AdminTranscriptionListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminTranscriptionListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminTranscriptionListItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminTranscriptionListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminTranscriptionListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminTranscriptionListItem)]),
          ) as BuiltList<AdminTranscriptionListItem>;
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
  AdminTranscriptionListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminTranscriptionListDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_flashcard_request.g.dart';

/// Payload for creating a new flashcard on a lesson.
///
/// Properties:
/// * [front] - Prompt side. Trimmed server-side, so it must contain a non-whitespace character.
/// * [back] - Answer side. Trimmed server-side, so it must contain a non-whitespace character.
/// * [sourceCueId] - Optional cuid of the TranscriptCue this card is made from — set when the card was created from a transcript line, omitted for manual and note-derived cards.
@BuiltValue()
abstract class CreateFlashcardRequest implements Built<CreateFlashcardRequest, CreateFlashcardRequestBuilder> {
  /// Prompt side. Trimmed server-side, so it must contain a non-whitespace character.
  @BuiltValueField(wireName: r'front')
  String get front;

  /// Answer side. Trimmed server-side, so it must contain a non-whitespace character.
  @BuiltValueField(wireName: r'back')
  String get back;

  /// Optional cuid of the TranscriptCue this card is made from — set when the card was created from a transcript line, omitted for manual and note-derived cards.
  @BuiltValueField(wireName: r'sourceCueId')
  String? get sourceCueId;

  CreateFlashcardRequest._();

  factory CreateFlashcardRequest([void updates(CreateFlashcardRequestBuilder b)]) = _$CreateFlashcardRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateFlashcardRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateFlashcardRequest> get serializer => _$CreateFlashcardRequestSerializer();
}

class _$CreateFlashcardRequestSerializer implements PrimitiveSerializer<CreateFlashcardRequest> {
  @override
  final Iterable<Type> types = const [CreateFlashcardRequest, _$CreateFlashcardRequest];

  @override
  final String wireName = r'CreateFlashcardRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'front';
    yield serializers.serialize(
      object.front,
      specifiedType: const FullType(String),
    );
    yield r'back';
    yield serializers.serialize(
      object.back,
      specifiedType: const FullType(String),
    );
    if (object.sourceCueId != null) {
      yield r'sourceCueId';
      yield serializers.serialize(
        object.sourceCueId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateFlashcardRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'front':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.front = valueDes;
          break;
        case r'back':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.back = valueDes;
          break;
        case r'sourceCueId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceCueId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateFlashcardRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateFlashcardRequestBuilder();
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


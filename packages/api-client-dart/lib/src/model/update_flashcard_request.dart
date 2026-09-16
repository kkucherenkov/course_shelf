//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_flashcard_request.g.dart';

/// Payload for updating a flashcard's front/back. At least one of `front` or `back` must be present — the server returns 400 on empty patches. Does not touch the review schedule.
///
/// Properties:
/// * [front] - New prompt side.
/// * [back] - New answer side.
@BuiltValue()
abstract class UpdateFlashcardRequest implements Built<UpdateFlashcardRequest, UpdateFlashcardRequestBuilder> {
  /// New prompt side.
  @BuiltValueField(wireName: r'front')
  String? get front;

  /// New answer side.
  @BuiltValueField(wireName: r'back')
  String? get back;

  UpdateFlashcardRequest._();

  factory UpdateFlashcardRequest([void updates(UpdateFlashcardRequestBuilder b)]) = _$UpdateFlashcardRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateFlashcardRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateFlashcardRequest> get serializer => _$UpdateFlashcardRequestSerializer();
}

class _$UpdateFlashcardRequestSerializer implements PrimitiveSerializer<UpdateFlashcardRequest> {
  @override
  final Iterable<Type> types = const [UpdateFlashcardRequest, _$UpdateFlashcardRequest];

  @override
  final String wireName = r'UpdateFlashcardRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.front != null) {
      yield r'front';
      yield serializers.serialize(
        object.front,
        specifiedType: const FullType(String),
      );
    }
    if (object.back != null) {
      yield r'back';
      yield serializers.serialize(
        object.back,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateFlashcardRequestBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateFlashcardRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateFlashcardRequestBuilder();
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


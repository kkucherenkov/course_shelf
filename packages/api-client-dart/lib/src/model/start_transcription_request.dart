//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'start_transcription_request.g.dart';

/// Payload for starting a transcription run. Body may be omitted entirely.
///
/// Properties:
/// * [force] - Re-transcribe lessons that already have a generated transcript. Hand-made subtitle sidecars are never overwritten.
@BuiltValue()
abstract class StartTranscriptionRequest implements Built<StartTranscriptionRequest, StartTranscriptionRequestBuilder> {
  /// Re-transcribe lessons that already have a generated transcript. Hand-made subtitle sidecars are never overwritten.
  @BuiltValueField(wireName: r'force')
  bool? get force;

  StartTranscriptionRequest._();

  factory StartTranscriptionRequest([void updates(StartTranscriptionRequestBuilder b)]) = _$StartTranscriptionRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StartTranscriptionRequestBuilder b) => b
      ..force = false;

  @BuiltValueSerializer(custom: true)
  static Serializer<StartTranscriptionRequest> get serializer => _$StartTranscriptionRequestSerializer();
}

class _$StartTranscriptionRequestSerializer implements PrimitiveSerializer<StartTranscriptionRequest> {
  @override
  final Iterable<Type> types = const [StartTranscriptionRequest, _$StartTranscriptionRequest];

  @override
  final String wireName = r'StartTranscriptionRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StartTranscriptionRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.force != null) {
      yield r'force';
      yield serializers.serialize(
        object.force,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    StartTranscriptionRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StartTranscriptionRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'force':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.force = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StartTranscriptionRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StartTranscriptionRequestBuilder();
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


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
/// * [language] - BCP-47 primary subtag for this run, or `auto`. Overrides the deployment's `WHISPER_LANGUAGE` for this run only. Naming the language skips whisper's per-file detection pass, which is repeated work on a library that is effectively one or two languages; it also records the transcript under that language tag instead of `und`, which is what `auto` can report. Omitted means \"use whatever this deployment is configured with\". A transcript is identified by `(lesson, language)`, so a run that names a language different from the one already on disk transcribes rather than skips — that is the point, not a bug.
@BuiltValue()
abstract class StartTranscriptionRequest implements Built<StartTranscriptionRequest, StartTranscriptionRequestBuilder> {
  /// Re-transcribe lessons that already have a generated transcript. Hand-made subtitle sidecars are never overwritten.
  @BuiltValueField(wireName: r'force')
  bool? get force;

  /// BCP-47 primary subtag for this run, or `auto`. Overrides the deployment's `WHISPER_LANGUAGE` for this run only. Naming the language skips whisper's per-file detection pass, which is repeated work on a library that is effectively one or two languages; it also records the transcript under that language tag instead of `und`, which is what `auto` can report. Omitted means \"use whatever this deployment is configured with\". A transcript is identified by `(lesson, language)`, so a run that names a language different from the one already on disk transcribes rather than skips — that is the point, not a bug.
  @BuiltValueField(wireName: r'language')
  String? get language;

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
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(String),
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
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.language = valueDes;
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


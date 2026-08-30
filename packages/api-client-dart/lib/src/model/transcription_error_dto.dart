//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcription_error_dto.g.dart';

/// A non-fatal per-lesson failure. One unreadable or undecodable video costs its own lesson, never the run.
///
/// Properties:
/// * [lessonId] - cuid of the lesson whose transcription failed.
/// * [message] - Human-readable description of what went wrong.
/// * [code] - Machine-readable error key (e.g. `whisper-failed`, `audio-extract-failed`, `no-video-source`).
@BuiltValue()
abstract class TranscriptionErrorDto implements Built<TranscriptionErrorDto, TranscriptionErrorDtoBuilder> {
  /// cuid of the lesson whose transcription failed.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Human-readable description of what went wrong.
  @BuiltValueField(wireName: r'message')
  String get message;

  /// Machine-readable error key (e.g. `whisper-failed`, `audio-extract-failed`, `no-video-source`).
  @BuiltValueField(wireName: r'code')
  String? get code;

  TranscriptionErrorDto._();

  factory TranscriptionErrorDto([void updates(TranscriptionErrorDtoBuilder b)]) = _$TranscriptionErrorDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TranscriptionErrorDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TranscriptionErrorDto> get serializer => _$TranscriptionErrorDtoSerializer();
}

class _$TranscriptionErrorDtoSerializer implements PrimitiveSerializer<TranscriptionErrorDto> {
  @override
  final Iterable<Type> types = const [TranscriptionErrorDto, _$TranscriptionErrorDto];

  @override
  final String wireName = r'TranscriptionErrorDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TranscriptionErrorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    if (object.code != null) {
      yield r'code';
      yield serializers.serialize(
        object.code,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TranscriptionErrorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TranscriptionErrorDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TranscriptionErrorDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TranscriptionErrorDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'upsert_note_request.g.dart';

/// Payload for creating or replacing the requester's note on a lesson.
///
/// Properties:
/// * [lessonId] - Server-generated cuid identifying the lesson.
/// * [body] - Plain Markdown. Trimmed server-side; an empty post-trim body is rejected as 400.
@BuiltValue()
abstract class UpsertNoteRequest implements Built<UpsertNoteRequest, UpsertNoteRequestBuilder> {
  /// Server-generated cuid identifying the lesson.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Plain Markdown. Trimmed server-side; an empty post-trim body is rejected as 400.
  @BuiltValueField(wireName: r'body')
  String get body;

  UpsertNoteRequest._();

  factory UpsertNoteRequest([void updates(UpsertNoteRequestBuilder b)]) = _$UpsertNoteRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpsertNoteRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpsertNoteRequest> get serializer => _$UpsertNoteRequestSerializer();
}

class _$UpsertNoteRequestSerializer implements PrimitiveSerializer<UpsertNoteRequest> {
  @override
  final Iterable<Type> types = const [UpsertNoteRequest, _$UpsertNoteRequest];

  @override
  final String wireName = r'UpsertNoteRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpsertNoteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'body';
    yield serializers.serialize(
      object.body,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpsertNoteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpsertNoteRequestBuilder result,
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
        case r'body':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.body = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpsertNoteRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpsertNoteRequestBuilder();
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


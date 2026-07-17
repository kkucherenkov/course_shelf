//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'record_progress_request.g.dart';

/// Payload for upserting the requester's progress on a lesson.
///
/// Properties:
/// * [lessonId] - Server-generated cuid identifying the lesson.
/// * [positionSeconds] - Last reported watch position in seconds. Clamped server-side to `[0, durationSeconds]`.
/// * [durationSeconds] - Lesson video duration in seconds. Clients pass the player's `duration` from the `loadedmetadata` event; it must match the server-side value once E06-F02-S02 (ffprobe) lands. v1 trusts the client value.
/// * [clientUpdatedAt] - ISO-8601 timestamp the client recorded the position. Out-of-order writes (older than the current `lastSeenAt`) are silently accepted and the response echoes the unchanged state.
@BuiltValue()
abstract class RecordProgressRequest implements Built<RecordProgressRequest, RecordProgressRequestBuilder> {
  /// Server-generated cuid identifying the lesson.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Last reported watch position in seconds. Clamped server-side to `[0, durationSeconds]`.
  @BuiltValueField(wireName: r'positionSeconds')
  int get positionSeconds;

  /// Lesson video duration in seconds. Clients pass the player's `duration` from the `loadedmetadata` event; it must match the server-side value once E06-F02-S02 (ffprobe) lands. v1 trusts the client value.
  @BuiltValueField(wireName: r'durationSeconds')
  int get durationSeconds;

  /// ISO-8601 timestamp the client recorded the position. Out-of-order writes (older than the current `lastSeenAt`) are silently accepted and the response echoes the unchanged state.
  @BuiltValueField(wireName: r'clientUpdatedAt')
  DateTime get clientUpdatedAt;

  RecordProgressRequest._();

  factory RecordProgressRequest([void updates(RecordProgressRequestBuilder b)]) = _$RecordProgressRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecordProgressRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecordProgressRequest> get serializer => _$RecordProgressRequestSerializer();
}

class _$RecordProgressRequestSerializer implements PrimitiveSerializer<RecordProgressRequest> {
  @override
  final Iterable<Type> types = const [RecordProgressRequest, _$RecordProgressRequest];

  @override
  final String wireName = r'RecordProgressRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecordProgressRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'positionSeconds';
    yield serializers.serialize(
      object.positionSeconds,
      specifiedType: const FullType(int),
    );
    yield r'durationSeconds';
    yield serializers.serialize(
      object.durationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'clientUpdatedAt';
    yield serializers.serialize(
      object.clientUpdatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecordProgressRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecordProgressRequestBuilder result,
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
        case r'positionSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.positionSeconds = valueDes;
          break;
        case r'durationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.durationSeconds = valueDes;
          break;
        case r'clientUpdatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.clientUpdatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecordProgressRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecordProgressRequestBuilder();
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


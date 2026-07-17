//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_bookmark_request.g.dart';

/// Payload for creating a new bookmark on a lesson.
///
/// Properties:
/// * [positionSeconds] - Playback position in seconds to pin the bookmark at.
/// * [label] - Optional free-form label. Trimmed server-side.
@BuiltValue()
abstract class CreateBookmarkRequest implements Built<CreateBookmarkRequest, CreateBookmarkRequestBuilder> {
  /// Playback position in seconds to pin the bookmark at.
  @BuiltValueField(wireName: r'positionSeconds')
  int get positionSeconds;

  /// Optional free-form label. Trimmed server-side.
  @BuiltValueField(wireName: r'label')
  String? get label;

  CreateBookmarkRequest._();

  factory CreateBookmarkRequest([void updates(CreateBookmarkRequestBuilder b)]) = _$CreateBookmarkRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateBookmarkRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateBookmarkRequest> get serializer => _$CreateBookmarkRequestSerializer();
}

class _$CreateBookmarkRequestSerializer implements PrimitiveSerializer<CreateBookmarkRequest> {
  @override
  final Iterable<Type> types = const [CreateBookmarkRequest, _$CreateBookmarkRequest];

  @override
  final String wireName = r'CreateBookmarkRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateBookmarkRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'positionSeconds';
    yield serializers.serialize(
      object.positionSeconds,
      specifiedType: const FullType(int),
    );
    if (object.label != null) {
      yield r'label';
      yield serializers.serialize(
        object.label,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateBookmarkRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateBookmarkRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'positionSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.positionSeconds = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateBookmarkRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateBookmarkRequestBuilder();
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


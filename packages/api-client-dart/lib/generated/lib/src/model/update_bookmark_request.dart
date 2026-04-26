//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_bookmark_request.g.dart';

/// Payload for updating a bookmark. All fields are optional, but at least one of `positionSeconds` or `label` must be present — the server returns 400 on empty patches. 
///
/// Properties:
/// * [positionSeconds] - New playback position in seconds.
/// * [label] - Pass an explicit `null` to clear the label; omit to leave it untouched.
@BuiltValue()
abstract class UpdateBookmarkRequest implements Built<UpdateBookmarkRequest, UpdateBookmarkRequestBuilder> {
  /// New playback position in seconds.
  @BuiltValueField(wireName: r'positionSeconds')
  int? get positionSeconds;

  /// Pass an explicit `null` to clear the label; omit to leave it untouched.
  @BuiltValueField(wireName: r'label')
  String? get label;

  UpdateBookmarkRequest._();

  factory UpdateBookmarkRequest([void updates(UpdateBookmarkRequestBuilder b)]) = _$UpdateBookmarkRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateBookmarkRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateBookmarkRequest> get serializer => _$UpdateBookmarkRequestSerializer();
}

class _$UpdateBookmarkRequestSerializer implements PrimitiveSerializer<UpdateBookmarkRequest> {
  @override
  final Iterable<Type> types = const [UpdateBookmarkRequest, _$UpdateBookmarkRequest];

  @override
  final String wireName = r'UpdateBookmarkRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateBookmarkRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.positionSeconds != null) {
      yield r'positionSeconds';
      yield serializers.serialize(
        object.positionSeconds,
        specifiedType: const FullType(int),
      );
    }
    if (object.label != null) {
      yield r'label';
      yield serializers.serialize(
        object.label,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateBookmarkRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateBookmarkRequestBuilder result,
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
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
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
  UpdateBookmarkRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateBookmarkRequestBuilder();
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


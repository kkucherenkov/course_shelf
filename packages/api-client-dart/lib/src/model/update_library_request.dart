//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_library_request.g.dart';

/// Patch body for `PATCH /libraries/{id}`. Currently only `name` is mutable; changing `rootPath` is intentionally unsupported.
///
/// Properties:
/// * [name] 
@BuiltValue()
abstract class UpdateLibraryRequest implements Built<UpdateLibraryRequest, UpdateLibraryRequestBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  UpdateLibraryRequest._();

  factory UpdateLibraryRequest([void updates(UpdateLibraryRequestBuilder b)]) = _$UpdateLibraryRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateLibraryRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateLibraryRequest> get serializer => _$UpdateLibraryRequestSerializer();
}

class _$UpdateLibraryRequestSerializer implements PrimitiveSerializer<UpdateLibraryRequest> {
  @override
  final Iterable<Type> types = const [UpdateLibraryRequest, _$UpdateLibraryRequest];

  @override
  final String wireName = r'UpdateLibraryRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateLibraryRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateLibraryRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateLibraryRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateLibraryRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateLibraryRequestBuilder();
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


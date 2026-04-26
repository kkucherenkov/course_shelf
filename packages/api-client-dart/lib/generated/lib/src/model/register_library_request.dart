//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'register_library_request.g.dart';

/// RegisterLibraryRequest
///
/// Properties:
/// * [name] - Human-readable label.
/// * [rootPath] - Absolute filesystem path to the library root. Accepts POSIX paths starting with `/` or Windows drive paths starting with `[A-Za-z]:\\`. Trailing slashes are allowed.
@BuiltValue()
abstract class RegisterLibraryRequest implements Built<RegisterLibraryRequest, RegisterLibraryRequestBuilder> {
  /// Human-readable label.
  @BuiltValueField(wireName: r'name')
  String get name;

  /// Absolute filesystem path to the library root. Accepts POSIX paths starting with `/` or Windows drive paths starting with `[A-Za-z]:\\`. Trailing slashes are allowed.
  @BuiltValueField(wireName: r'rootPath')
  String get rootPath;

  RegisterLibraryRequest._();

  factory RegisterLibraryRequest([void updates(RegisterLibraryRequestBuilder b)]) = _$RegisterLibraryRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RegisterLibraryRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RegisterLibraryRequest> get serializer => _$RegisterLibraryRequestSerializer();
}

class _$RegisterLibraryRequestSerializer implements PrimitiveSerializer<RegisterLibraryRequest> {
  @override
  final Iterable<Type> types = const [RegisterLibraryRequest, _$RegisterLibraryRequest];

  @override
  final String wireName = r'RegisterLibraryRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RegisterLibraryRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'rootPath';
    yield serializers.serialize(
      object.rootPath,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RegisterLibraryRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RegisterLibraryRequestBuilder result,
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
        case r'rootPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.rootPath = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RegisterLibraryRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RegisterLibraryRequestBuilder();
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


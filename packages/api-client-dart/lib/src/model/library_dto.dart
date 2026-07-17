//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_dto.g.dart';

/// LibraryDto
///
/// Properties:
/// * [id] - Server-generated identifier.
/// * [name] - Human-readable label.
/// * [rootPath] - Absolute filesystem path to the library root. Must start with `/` (POSIX) or `[A-Za-z]:\\` (Windows).
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class LibraryDto implements Built<LibraryDto, LibraryDtoBuilder> {
  /// Server-generated identifier.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Human-readable label.
  @BuiltValueField(wireName: r'name')
  String get name;

  /// Absolute filesystem path to the library root. Must start with `/` (POSIX) or `[A-Za-z]:\\` (Windows).
  @BuiltValueField(wireName: r'rootPath')
  String get rootPath;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  LibraryDto._();

  factory LibraryDto([void updates(LibraryDtoBuilder b)]) = _$LibraryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryDto> get serializer => _$LibraryDtoSerializer();
}

class _$LibraryDtoSerializer implements PrimitiveSerializer<LibraryDto> {
  @override
  final Iterable<Type> types = const [LibraryDto, _$LibraryDto];

  @override
  final String wireName = r'LibraryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LibraryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_target.g.dart';

/// LibraryTarget
///
/// Properties:
/// * [kind] - Discriminator value indicating a library-scoped grant.
/// * [libraryId] - Server-generated cuid of the target library.
@BuiltValue()
abstract class LibraryTarget implements Built<LibraryTarget, LibraryTargetBuilder> {
  /// Discriminator value indicating a library-scoped grant.
  @BuiltValueField(wireName: r'kind')
  LibraryTargetKindEnum get kind;
  // enum kindEnum {  library,  };

  /// Server-generated cuid of the target library.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  LibraryTarget._();

  factory LibraryTarget([void updates(LibraryTargetBuilder b)]) = _$LibraryTarget;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryTargetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryTarget> get serializer => _$LibraryTargetSerializer();
}

class _$LibraryTargetSerializer implements PrimitiveSerializer<LibraryTarget> {
  @override
  final Iterable<Type> types = const [LibraryTarget, _$LibraryTarget];

  @override
  final String wireName = r'LibraryTarget';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(LibraryTargetKindEnum),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryTargetBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LibraryTargetKindEnum),
          ) as LibraryTargetKindEnum;
          result.kind = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LibraryTarget deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryTargetBuilder();
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

class LibraryTargetKindEnum extends EnumClass {

  /// Discriminator value indicating a library-scoped grant.
  @BuiltValueEnumConst(wireName: r'library')
  static const LibraryTargetKindEnum library_ = _$libraryTargetKindEnum_library_;

  static Serializer<LibraryTargetKindEnum> get serializer => _$libraryTargetKindEnumSerializer;

  const LibraryTargetKindEnum._(String name): super(name);

  static BuiltSet<LibraryTargetKindEnum> get values => _$libraryTargetKindEnumValues;
  static LibraryTargetKindEnum valueOf(String name) => _$libraryTargetKindEnumValueOf(name);
}


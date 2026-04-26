//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/material_kind.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'material_dto.g.dart';

/// A sidecar material attached to a lesson.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this material.
/// * [kind] 
/// * [label] - Human-readable name derived from the original filename (extension stripped, ordinal prefix preserved if present).
/// * [sizeBytes] - File size in bytes.
@BuiltValue()
abstract class MaterialDto implements Built<MaterialDto, MaterialDtoBuilder> {
  /// Server-generated cuid identifying this material.
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'kind')
  MaterialKind get kind;
  // enum kindEnum {  doc,  note,  image,  slide,  };

  /// Human-readable name derived from the original filename (extension stripped, ordinal prefix preserved if present).
  @BuiltValueField(wireName: r'label')
  String get label;

  /// File size in bytes.
  @BuiltValueField(wireName: r'sizeBytes')
  int get sizeBytes;

  MaterialDto._();

  factory MaterialDto([void updates(MaterialDtoBuilder b)]) = _$MaterialDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MaterialDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MaterialDto> get serializer => _$MaterialDtoSerializer();
}

class _$MaterialDtoSerializer implements PrimitiveSerializer<MaterialDto> {
  @override
  final Iterable<Type> types = const [MaterialDto, _$MaterialDto];

  @override
  final String wireName = r'MaterialDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MaterialDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(MaterialKind),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MaterialDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MaterialDtoBuilder result,
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
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MaterialKind),
          ) as MaterialKind;
          result.kind = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.sizeBytes = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MaterialDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MaterialDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'model0.g.dart';

/// Model0
///
/// Properties:
/// * [kind] - Discriminator value indicating a library-scoped grant.
/// * [libraryId] - Server-generated cuid of the target library.
@BuiltValue()
abstract class Model0 implements Built<Model0, Model0Builder> {
  /// Discriminator value indicating a library-scoped grant.
  @BuiltValueField(wireName: r'kind')
  Model0KindEnum get kind;
  // enum kindEnum {  library,  };

  /// Server-generated cuid of the target library.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  Model0._();

  factory Model0([void updates(Model0Builder b)]) = _$Model0;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(Model0Builder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Model0> get serializer => _$Model0Serializer();
}

class _$Model0Serializer implements PrimitiveSerializer<Model0> {
  @override
  final Iterable<Type> types = const [Model0, _$Model0];

  @override
  final String wireName = r'Model0';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Model0 object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(Model0KindEnum),
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
    Model0 object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required Model0Builder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Model0KindEnum),
          ) as Model0KindEnum;
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
  Model0 deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = Model0Builder();
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

class Model0KindEnum extends EnumClass {

  /// Discriminator value indicating a library-scoped grant.
  @BuiltValueEnumConst(wireName: r'library')
  static const Model0KindEnum library_ = _$model0KindEnum_library_;

  static Serializer<Model0KindEnum> get serializer => _$model0KindEnumSerializer;

  const Model0KindEnum._(String name): super(name);

  static BuiltSet<Model0KindEnum> get values => _$model0KindEnumValues;
  static Model0KindEnum valueOf(String name) => _$model0KindEnumValueOf(name);
}


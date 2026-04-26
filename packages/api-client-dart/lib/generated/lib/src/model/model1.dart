//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'model1.g.dart';

/// Model1
///
/// Properties:
/// * [kind] - Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
/// * [courseId] - Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
@BuiltValue()
abstract class Model1 implements Built<Model1, Model1Builder> {
  /// Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
  @BuiltValueField(wireName: r'kind')
  Model1KindEnum get kind;
  // enum kindEnum {  course,  };

  /// Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  Model1._();

  factory Model1([void updates(Model1Builder b)]) = _$Model1;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(Model1Builder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Model1> get serializer => _$Model1Serializer();
}

class _$Model1Serializer implements PrimitiveSerializer<Model1> {
  @override
  final Iterable<Type> types = const [Model1, _$Model1];

  @override
  final String wireName = r'Model1';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Model1 object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(Model1KindEnum),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Model1 object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required Model1Builder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Model1KindEnum),
          ) as Model1KindEnum;
          result.kind = valueDes;
          break;
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  Model1 deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = Model1Builder();
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

class Model1KindEnum extends EnumClass {

  /// Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
  @BuiltValueEnumConst(wireName: r'course')
  static const Model1KindEnum course = _$model1KindEnum_course;

  static Serializer<Model1KindEnum> get serializer => _$model1KindEnumSerializer;

  const Model1KindEnum._(String name): super(name);

  static BuiltSet<Model1KindEnum> get values => _$model1KindEnumValues;
  static Model1KindEnum valueOf(String name) => _$model1KindEnumValueOf(name);
}


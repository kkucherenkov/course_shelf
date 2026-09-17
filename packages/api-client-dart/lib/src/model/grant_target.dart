//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/course_target.dart';
import 'package:app_api_client/src/model/library_target.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/model0.dart';
import 'package:app_api_client/src/model/model1.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'grant_target.g.dart';

/// The resource to which access is granted. Discriminated by `kind`.
///
/// Properties:
/// * [kind] - Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
/// * [libraryId] - Server-generated cuid of the target library.
/// * [courseId] - Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
@BuiltValue()
abstract class GrantTarget implements Built<GrantTarget, GrantTargetBuilder> {
  /// One Of [CourseTarget], [LibraryTarget]
  OneOf get oneOf;

  static const String discriminatorFieldName = r'kind';

  static const Map<String, Type> discriminatorMapping = {
    r'course': Model1,
    r'library': Model0,
  };

  GrantTarget._();

  factory GrantTarget([void updates(GrantTargetBuilder b)]) = _$GrantTarget;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GrantTargetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GrantTarget> get serializer => _$GrantTargetSerializer();
}

extension GrantTargetDiscriminatorExt on GrantTarget {
    String? get discriminatorValue {
        if (this is Model1) {
            return r'course';
        }
        if (this is Model0) {
            return r'library';
        }
        return null;
    }
}
extension GrantTargetBuilderDiscriminatorExt on GrantTargetBuilder {
    String? get discriminatorValue {
        if (this is Model1Builder) {
            return r'course';
        }
        if (this is Model0Builder) {
            return r'library';
        }
        return null;
    }
}

class _$GrantTargetSerializer implements PrimitiveSerializer<GrantTarget> {
  @override
  final Iterable<Type> types = const [GrantTarget, _$GrantTarget];

  @override
  final String wireName = r'GrantTarget';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GrantTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    GrantTarget object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  GrantTarget deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GrantTargetBuilder();
    Object? oneOfDataSrc;
    final serializedList = (serialized as Iterable<Object?>).toList();
    final discIndex = serializedList.indexOf(GrantTarget.discriminatorFieldName) + 1;
    final discValue = serializers.deserialize(serializedList[discIndex], specifiedType: FullType(String)) as String;
    oneOfDataSrc = serialized;
    final oneOfTypes = [Model1, Model0, ];
    Object oneOfResult;
    Type oneOfType;
    switch (discValue) {
      case r'course':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(Model1),
        ) as Model1;
        oneOfType = Model1;
        break;
      case r'library':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(Model0),
        ) as Model0;
        oneOfType = Model0;
        break;
      default:
        throw UnsupportedError("Couldn't deserialize oneOf for the discriminator value: ${discValue}");
    }
    result.oneOf = OneOfDynamic(typeIndex: oneOfTypes.indexOf(oneOfType), types: oneOfTypes, value: oneOfResult);
    return result.build();
  }
}

class GrantTargetKindEnum extends EnumClass {

  /// Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
  @BuiltValueEnumConst(wireName: r'course')
  static const GrantTargetKindEnum course = _$grantTargetKindEnum_course;

  static Serializer<GrantTargetKindEnum> get serializer => _$grantTargetKindEnumSerializer;

  const GrantTargetKindEnum._(String name): super(name);

  static BuiltSet<GrantTargetKindEnum> get values => _$grantTargetKindEnumValues;
  static GrantTargetKindEnum valueOf(String name) => _$grantTargetKindEnumValueOf(name);
}


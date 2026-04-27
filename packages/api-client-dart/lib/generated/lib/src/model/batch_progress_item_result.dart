//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/batch_progress_item_forbidden.dart';
import 'package:app_api_client/src/model/batch_progress_item_stale.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/batch_progress_item_accepted.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'batch_progress_item_result.g.dart';

/// BatchProgressItemResult
///
/// Properties:
/// * [status] - Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
/// * [state] 
/// * [lessonId] - Echoes the input `lessonId` for client correlation.
@BuiltValue()
abstract class BatchProgressItemResult implements Built<BatchProgressItemResult, BatchProgressItemResultBuilder> {
  /// One Of [BatchProgressItemAccepted], [BatchProgressItemForbidden], [BatchProgressItemStale]
  OneOf get oneOf;

  static const String discriminatorFieldName = r'status';

  static const Map<String, Type> discriminatorMapping = {
    r'accepted': BatchProgressItemAccepted,
    r'forbidden': BatchProgressItemForbidden,
    r'stale': BatchProgressItemStale,
  };

  BatchProgressItemResult._();

  factory BatchProgressItemResult([void updates(BatchProgressItemResultBuilder b)]) = _$BatchProgressItemResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressItemResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressItemResult> get serializer => _$BatchProgressItemResultSerializer();
}

extension BatchProgressItemResultDiscriminatorExt on BatchProgressItemResult {
    String? get discriminatorValue {
        if (this is BatchProgressItemAccepted) {
            return r'accepted';
        }
        if (this is BatchProgressItemForbidden) {
            return r'forbidden';
        }
        if (this is BatchProgressItemStale) {
            return r'stale';
        }
        return null;
    }
}
extension BatchProgressItemResultBuilderDiscriminatorExt on BatchProgressItemResultBuilder {
    String? get discriminatorValue {
        if (this is BatchProgressItemAcceptedBuilder) {
            return r'accepted';
        }
        if (this is BatchProgressItemForbiddenBuilder) {
            return r'forbidden';
        }
        if (this is BatchProgressItemStaleBuilder) {
            return r'stale';
        }
        return null;
    }
}

class _$BatchProgressItemResultSerializer implements PrimitiveSerializer<BatchProgressItemResult> {
  @override
  final Iterable<Type> types = const [BatchProgressItemResult, _$BatchProgressItemResult];

  @override
  final String wireName = r'BatchProgressItemResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressItemResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  BatchProgressItemResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressItemResultBuilder();
    Object? oneOfDataSrc;
    final serializedList = (serialized as Iterable<Object?>).toList();
    final discIndex = serializedList.indexOf(BatchProgressItemResult.discriminatorFieldName) + 1;
    final discValue = serializers.deserialize(serializedList[discIndex], specifiedType: FullType(String)) as String;
    oneOfDataSrc = serialized;
    final oneOfTypes = [BatchProgressItemAccepted, BatchProgressItemForbidden, BatchProgressItemStale, ];
    Object oneOfResult;
    Type oneOfType;
    switch (discValue) {
      case r'accepted':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(BatchProgressItemAccepted),
        ) as BatchProgressItemAccepted;
        oneOfType = BatchProgressItemAccepted;
        break;
      case r'forbidden':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(BatchProgressItemForbidden),
        ) as BatchProgressItemForbidden;
        oneOfType = BatchProgressItemForbidden;
        break;
      case r'stale':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(BatchProgressItemStale),
        ) as BatchProgressItemStale;
        oneOfType = BatchProgressItemStale;
        break;
      default:
        throw UnsupportedError("Couldn't deserialize oneOf for the discriminator value: ${discValue}");
    }
    result.oneOf = OneOfDynamic(typeIndex: oneOfTypes.indexOf(oneOfType), types: oneOfTypes, value: oneOfResult);
    return result.build();
  }
}

class BatchProgressItemResultStatusEnum extends EnumClass {

  /// Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
  @BuiltValueEnumConst(wireName: r'forbidden')
  static const BatchProgressItemResultStatusEnum forbidden = _$batchProgressItemResultStatusEnum_forbidden;

  static Serializer<BatchProgressItemResultStatusEnum> get serializer => _$batchProgressItemResultStatusEnumSerializer;

  const BatchProgressItemResultStatusEnum._(String name): super(name);

  static BuiltSet<BatchProgressItemResultStatusEnum> get values => _$batchProgressItemResultStatusEnumValues;
  static BatchProgressItemResultStatusEnum valueOf(String name) => _$batchProgressItemResultStatusEnumValueOf(name);
}


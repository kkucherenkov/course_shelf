//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'backfill_metadata_request.g.dart';

/// Optional scope for a metadata backfill job. When both fields are omitted the backfill runs across all libraries. 
///
/// Properties:
/// * [libraryId] - cuid of the library to restrict the backfill to. Omit to backfill all libraries.
@BuiltValue()
abstract class BackfillMetadataRequest implements Built<BackfillMetadataRequest, BackfillMetadataRequestBuilder> {
  /// cuid of the library to restrict the backfill to. Omit to backfill all libraries.
  @BuiltValueField(wireName: r'libraryId')
  String? get libraryId;

  BackfillMetadataRequest._();

  factory BackfillMetadataRequest([void updates(BackfillMetadataRequestBuilder b)]) = _$BackfillMetadataRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BackfillMetadataRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BackfillMetadataRequest> get serializer => _$BackfillMetadataRequestSerializer();
}

class _$BackfillMetadataRequestSerializer implements PrimitiveSerializer<BackfillMetadataRequest> {
  @override
  final Iterable<Type> types = const [BackfillMetadataRequest, _$BackfillMetadataRequest];

  @override
  final String wireName = r'BackfillMetadataRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BackfillMetadataRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.libraryId != null) {
      yield r'libraryId';
      yield serializers.serialize(
        object.libraryId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    BackfillMetadataRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BackfillMetadataRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
  BackfillMetadataRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BackfillMetadataRequestBuilder();
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


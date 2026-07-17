//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'backfill_job_accepted.g.dart';

/// Confirmation that a backfill job has been accepted and is running in the background.
///
/// Properties:
/// * [jobId] - Unique cuid identifying the background job. Subscribe to `maintenance:backfill:{jobId}` on Centrifugo for progress events.
@BuiltValue()
abstract class BackfillJobAccepted implements Built<BackfillJobAccepted, BackfillJobAcceptedBuilder> {
  /// Unique cuid identifying the background job. Subscribe to `maintenance:backfill:{jobId}` on Centrifugo for progress events.
  @BuiltValueField(wireName: r'jobId')
  String get jobId;

  BackfillJobAccepted._();

  factory BackfillJobAccepted([void updates(BackfillJobAcceptedBuilder b)]) = _$BackfillJobAccepted;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BackfillJobAcceptedBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BackfillJobAccepted> get serializer => _$BackfillJobAcceptedSerializer();
}

class _$BackfillJobAcceptedSerializer implements PrimitiveSerializer<BackfillJobAccepted> {
  @override
  final Iterable<Type> types = const [BackfillJobAccepted, _$BackfillJobAccepted];

  @override
  final String wireName = r'BackfillJobAccepted';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BackfillJobAccepted object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'jobId';
    yield serializers.serialize(
      object.jobId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BackfillJobAccepted object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BackfillJobAcceptedBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'jobId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.jobId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BackfillJobAccepted deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BackfillJobAcceptedBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'external_id_ref.g.dart';

/// A reference to an entity in an external system (e.g. Udemy, YouTube).
///
/// Properties:
/// * [source_] - Namespace identifying the external system (e.g. `udemy`, `youtube`). Scrapers are responsible for namespacing their ids (e.g. `youtube:playlist:PLxxx` vs `youtube:channel:UCyyy`).
/// * [externalId] - Identifier within the source system.
/// * [url] - Optional canonical URL of the entity on the source platform.
@BuiltValue()
abstract class ExternalIdRef implements Built<ExternalIdRef, ExternalIdRefBuilder> {
  /// Namespace identifying the external system (e.g. `udemy`, `youtube`). Scrapers are responsible for namespacing their ids (e.g. `youtube:playlist:PLxxx` vs `youtube:channel:UCyyy`).
  @BuiltValueField(wireName: r'source')
  String get source_;

  /// Identifier within the source system.
  @BuiltValueField(wireName: r'externalId')
  String get externalId;

  /// Optional canonical URL of the entity on the source platform.
  @BuiltValueField(wireName: r'url')
  String? get url;

  ExternalIdRef._();

  factory ExternalIdRef([void updates(ExternalIdRefBuilder b)]) = _$ExternalIdRef;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExternalIdRefBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExternalIdRef> get serializer => _$ExternalIdRefSerializer();
}

class _$ExternalIdRefSerializer implements PrimitiveSerializer<ExternalIdRef> {
  @override
  final Iterable<Type> types = const [ExternalIdRef, _$ExternalIdRef];

  @override
  final String wireName = r'ExternalIdRef';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExternalIdRef object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(String),
    );
    yield r'externalId';
    yield serializers.serialize(
      object.externalId,
      specifiedType: const FullType(String),
    );
    if (object.url != null) {
      yield r'url';
      yield serializers.serialize(
        object.url,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExternalIdRef object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExternalIdRefBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.source_ = valueDes;
          break;
        case r'externalId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.externalId = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExternalIdRef deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExternalIdRefBuilder();
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


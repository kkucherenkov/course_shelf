//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sso_provider_config.g.dart';

/// One configured SSO / OAuth provider, rendered as an SsoBlock button.
///
/// Properties:
/// * [id] - Stable identifier (e.g. `google`, `github`, `okta-foo`). Emitted on click.
/// * [label] - Human-readable label (e.g. `Continue with Google`).
/// * [iconName] - IconCS glyph name (e.g. `mail`, `github`, `key`).
@BuiltValue()
abstract class SsoProviderConfig implements Built<SsoProviderConfig, SsoProviderConfigBuilder> {
  /// Stable identifier (e.g. `google`, `github`, `okta-foo`). Emitted on click.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Human-readable label (e.g. `Continue with Google`).
  @BuiltValueField(wireName: r'label')
  String get label;

  /// IconCS glyph name (e.g. `mail`, `github`, `key`).
  @BuiltValueField(wireName: r'iconName')
  String get iconName;

  SsoProviderConfig._();

  factory SsoProviderConfig([void updates(SsoProviderConfigBuilder b)]) = _$SsoProviderConfig;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SsoProviderConfigBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SsoProviderConfig> get serializer => _$SsoProviderConfigSerializer();
}

class _$SsoProviderConfigSerializer implements PrimitiveSerializer<SsoProviderConfig> {
  @override
  final Iterable<Type> types = const [SsoProviderConfig, _$SsoProviderConfig];

  @override
  final String wireName = r'SsoProviderConfig';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SsoProviderConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    yield r'iconName';
    yield serializers.serialize(
      object.iconName,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SsoProviderConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SsoProviderConfigBuilder result,
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
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'iconName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.iconName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SsoProviderConfig deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SsoProviderConfigBuilder();
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


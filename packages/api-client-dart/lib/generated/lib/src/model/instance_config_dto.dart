//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/sso_provider_config.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'instance_config_dto.g.dart';

/// Public runtime configuration. Read once at app boot; cache for the session.
///
/// Properties:
/// * [selfRegistration] - When false, sign-up CTAs are hidden and /sign-up redirects to /sign-in.
/// * [emailVerificationRequired] - When true, sign-up wizard renders the 6-digit-code step between account creation and library setup.
/// * [ssoProviders] - Configured OAuth / SSO providers. Empty array in v1 — Better Auth's `genericOAuth` plugin lands in v2.
@BuiltValue()
abstract class InstanceConfigDto implements Built<InstanceConfigDto, InstanceConfigDtoBuilder> {
  /// When false, sign-up CTAs are hidden and /sign-up redirects to /sign-in.
  @BuiltValueField(wireName: r'selfRegistration')
  bool get selfRegistration;

  /// When true, sign-up wizard renders the 6-digit-code step between account creation and library setup.
  @BuiltValueField(wireName: r'emailVerificationRequired')
  bool get emailVerificationRequired;

  /// Configured OAuth / SSO providers. Empty array in v1 — Better Auth's `genericOAuth` plugin lands in v2.
  @BuiltValueField(wireName: r'ssoProviders')
  BuiltList<SsoProviderConfig> get ssoProviders;

  InstanceConfigDto._();

  factory InstanceConfigDto([void updates(InstanceConfigDtoBuilder b)]) = _$InstanceConfigDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstanceConfigDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstanceConfigDto> get serializer => _$InstanceConfigDtoSerializer();
}

class _$InstanceConfigDtoSerializer implements PrimitiveSerializer<InstanceConfigDto> {
  @override
  final Iterable<Type> types = const [InstanceConfigDto, _$InstanceConfigDto];

  @override
  final String wireName = r'InstanceConfigDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstanceConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'selfRegistration';
    yield serializers.serialize(
      object.selfRegistration,
      specifiedType: const FullType(bool),
    );
    yield r'emailVerificationRequired';
    yield serializers.serialize(
      object.emailVerificationRequired,
      specifiedType: const FullType(bool),
    );
    yield r'ssoProviders';
    yield serializers.serialize(
      object.ssoProviders,
      specifiedType: const FullType(BuiltList, [FullType(SsoProviderConfig)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    InstanceConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstanceConfigDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'selfRegistration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.selfRegistration = valueDes;
          break;
        case r'emailVerificationRequired':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.emailVerificationRequired = valueDes;
          break;
        case r'ssoProviders':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SsoProviderConfig)]),
          ) as BuiltList<SsoProviderConfig>;
          result.ssoProviders.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InstanceConfigDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstanceConfigDtoBuilder();
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


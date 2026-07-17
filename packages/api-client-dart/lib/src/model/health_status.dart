//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/dependency_status.dart';
import 'package:app_api_client/src/model/health_status_dependencies.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'health_status.g.dart';

/// HealthStatus
///
/// Properties:
/// * [status] 
/// * [version] - Semantic version of the running backend build
/// * [uptimeSeconds] - Seconds since the backend process started
/// * [dependencies] 
@BuiltValue()
abstract class HealthStatus implements Built<HealthStatus, HealthStatusBuilder> {
  @BuiltValueField(wireName: r'status')
  DependencyStatus? get status;
  // enum statusEnum {  ok,  degraded,  down,  };

  /// Semantic version of the running backend build
  @BuiltValueField(wireName: r'version')
  String? get version;

  /// Seconds since the backend process started
  @BuiltValueField(wireName: r'uptimeSeconds')
  int get uptimeSeconds;

  @BuiltValueField(wireName: r'dependencies')
  HealthStatusDependencies get dependencies;

  HealthStatus._();

  factory HealthStatus([void updates(HealthStatusBuilder b)]) = _$HealthStatus;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HealthStatusBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HealthStatus> get serializer => _$HealthStatusSerializer();
}

class _$HealthStatusSerializer implements PrimitiveSerializer<HealthStatus> {
  @override
  final Iterable<Type> types = const [HealthStatus, _$HealthStatus];

  @override
  final String wireName = r'HealthStatus';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HealthStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield object.status == null ? null : serializers.serialize(
      object.status,
      specifiedType: const FullType.nullable(DependencyStatus),
    );
    yield r'version';
    yield object.version == null ? null : serializers.serialize(
      object.version,
      specifiedType: const FullType.nullable(String),
    );
    yield r'uptimeSeconds';
    yield serializers.serialize(
      object.uptimeSeconds,
      specifiedType: const FullType(int),
    );
    yield r'dependencies';
    yield serializers.serialize(
      object.dependencies,
      specifiedType: const FullType(HealthStatusDependencies),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HealthStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required HealthStatusBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DependencyStatus),
          ) as DependencyStatus?;
          if (valueDes == null) continue;
          result.status = valueDes;
          break;
        case r'version':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.version = valueDes;
          break;
        case r'uptimeSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.uptimeSeconds = valueDes;
          break;
        case r'dependencies':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(HealthStatusDependencies),
          ) as HealthStatusDependencies;
          result.dependencies.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  HealthStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HealthStatusBuilder();
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


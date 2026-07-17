//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/dependency_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'health_status_dependencies.g.dart';

/// HealthStatusDependencies
///
/// Properties:
/// * [db] 
/// * [redis] 
/// * [centrifugo] 
@BuiltValue()
abstract class HealthStatusDependencies implements Built<HealthStatusDependencies, HealthStatusDependenciesBuilder> {
  @BuiltValueField(wireName: r'db')
  DependencyStatus? get db;
  // enum dbEnum {  ok,  degraded,  down,  };

  @BuiltValueField(wireName: r'redis')
  DependencyStatus? get redis;
  // enum redisEnum {  ok,  degraded,  down,  };

  @BuiltValueField(wireName: r'centrifugo')
  DependencyStatus? get centrifugo;
  // enum centrifugoEnum {  ok,  degraded,  down,  };

  HealthStatusDependencies._();

  factory HealthStatusDependencies([void updates(HealthStatusDependenciesBuilder b)]) = _$HealthStatusDependencies;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HealthStatusDependenciesBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HealthStatusDependencies> get serializer => _$HealthStatusDependenciesSerializer();
}

class _$HealthStatusDependenciesSerializer implements PrimitiveSerializer<HealthStatusDependencies> {
  @override
  final Iterable<Type> types = const [HealthStatusDependencies, _$HealthStatusDependencies];

  @override
  final String wireName = r'HealthStatusDependencies';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HealthStatusDependencies object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'db';
    yield object.db == null ? null : serializers.serialize(
      object.db,
      specifiedType: const FullType.nullable(DependencyStatus),
    );
    yield r'redis';
    yield object.redis == null ? null : serializers.serialize(
      object.redis,
      specifiedType: const FullType.nullable(DependencyStatus),
    );
    yield r'centrifugo';
    yield object.centrifugo == null ? null : serializers.serialize(
      object.centrifugo,
      specifiedType: const FullType.nullable(DependencyStatus),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HealthStatusDependencies object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required HealthStatusDependenciesBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'db':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DependencyStatus),
          ) as DependencyStatus?;
          if (valueDes == null) continue;
          result.db = valueDes;
          break;
        case r'redis':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DependencyStatus),
          ) as DependencyStatus?;
          if (valueDes == null) continue;
          result.redis = valueDes;
          break;
        case r'centrifugo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DependencyStatus),
          ) as DependencyStatus?;
          if (valueDes == null) continue;
          result.centrifugo = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  HealthStatusDependencies deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HealthStatusDependenciesBuilder();
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


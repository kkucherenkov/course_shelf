//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_dashboard_dto_counts.dart';
import 'package:app_api_client/src/model/admin_dashboard_latest_scan.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_dashboard_dto.g.dart';

/// AdminDashboardDto
///
/// Properties:
/// * [generatedAt] - ISO-8601 instant when the snapshot was assembled (server clock).
/// * [counts] 
/// * [latestScan] 
/// * [errorsLast24h] - Count of `ScanErrorRecord` rows whose parent scan started within the last 24 hours (rolling window from `generatedAt`). Uses the parent scan's `startedAt` because the error record itself has no timestamp; works because no scan is expected to outlive a single 24-hour window. 
@BuiltValue()
abstract class AdminDashboardDto implements Built<AdminDashboardDto, AdminDashboardDtoBuilder> {
  /// ISO-8601 instant when the snapshot was assembled (server clock).
  @BuiltValueField(wireName: r'generatedAt')
  DateTime get generatedAt;

  @BuiltValueField(wireName: r'counts')
  AdminDashboardDtoCounts get counts;

  @BuiltValueField(wireName: r'latestScan')
  AdminDashboardLatestScan? get latestScan;

  /// Count of `ScanErrorRecord` rows whose parent scan started within the last 24 hours (rolling window from `generatedAt`). Uses the parent scan's `startedAt` because the error record itself has no timestamp; works because no scan is expected to outlive a single 24-hour window. 
  @BuiltValueField(wireName: r'errorsLast24h')
  int get errorsLast24h;

  AdminDashboardDto._();

  factory AdminDashboardDto([void updates(AdminDashboardDtoBuilder b)]) = _$AdminDashboardDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminDashboardDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminDashboardDto> get serializer => _$AdminDashboardDtoSerializer();
}

class _$AdminDashboardDtoSerializer implements PrimitiveSerializer<AdminDashboardDto> {
  @override
  final Iterable<Type> types = const [AdminDashboardDto, _$AdminDashboardDto];

  @override
  final String wireName = r'AdminDashboardDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminDashboardDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'generatedAt';
    yield serializers.serialize(
      object.generatedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'counts';
    yield serializers.serialize(
      object.counts,
      specifiedType: const FullType(AdminDashboardDtoCounts),
    );
    yield r'latestScan';
    yield object.latestScan == null ? null : serializers.serialize(
      object.latestScan,
      specifiedType: const FullType.nullable(AdminDashboardLatestScan),
    );
    yield r'errorsLast24h';
    yield serializers.serialize(
      object.errorsLast24h,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminDashboardDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminDashboardDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'generatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.generatedAt = valueDes;
          break;
        case r'counts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminDashboardDtoCounts),
          ) as AdminDashboardDtoCounts;
          result.counts.replace(valueDes);
          break;
        case r'latestScan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(AdminDashboardLatestScan),
          ) as AdminDashboardLatestScan?;
          if (valueDes == null) continue;
          result.latestScan.replace(valueDes);
          break;
        case r'errorsLast24h':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.errorsLast24h = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminDashboardDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminDashboardDtoBuilder();
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


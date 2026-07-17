//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scan_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_dashboard_latest_scan.g.dart';

/// AdminDashboardLatestScan
///
/// Properties:
/// * [scanId] - cuid identifying the scan.
/// * [libraryId] - cuid of the library this scan ran against.
/// * [status] 
/// * [startedAt] 
/// * [finishedAt] 
/// * [filesScanned] 
/// * [errorsCount] - Number of error records attached to this scan.
@BuiltValue()
abstract class AdminDashboardLatestScan implements Built<AdminDashboardLatestScan, AdminDashboardLatestScanBuilder> {
  /// cuid identifying the scan.
  @BuiltValueField(wireName: r'scanId')
  String get scanId;

  /// cuid of the library this scan ran against.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  @BuiltValueField(wireName: r'status')
  ScanStatus get status;
  // enum statusEnum {  running,  succeeded,  failed,  cancelled,  };

  @BuiltValueField(wireName: r'startedAt')
  DateTime get startedAt;

  @BuiltValueField(wireName: r'finishedAt')
  DateTime? get finishedAt;

  @BuiltValueField(wireName: r'filesScanned')
  int get filesScanned;

  /// Number of error records attached to this scan.
  @BuiltValueField(wireName: r'errorsCount')
  int get errorsCount;

  AdminDashboardLatestScan._();

  factory AdminDashboardLatestScan([void updates(AdminDashboardLatestScanBuilder b)]) = _$AdminDashboardLatestScan;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminDashboardLatestScanBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminDashboardLatestScan> get serializer => _$AdminDashboardLatestScanSerializer();
}

class _$AdminDashboardLatestScanSerializer implements PrimitiveSerializer<AdminDashboardLatestScan> {
  @override
  final Iterable<Type> types = const [AdminDashboardLatestScan, _$AdminDashboardLatestScan];

  @override
  final String wireName = r'AdminDashboardLatestScan';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminDashboardLatestScan object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'scanId';
    yield serializers.serialize(
      object.scanId,
      specifiedType: const FullType(String),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ScanStatus),
    );
    yield r'startedAt';
    yield serializers.serialize(
      object.startedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'finishedAt';
    yield object.finishedAt == null ? null : serializers.serialize(
      object.finishedAt,
      specifiedType: const FullType.nullable(DateTime),
    );
    yield r'filesScanned';
    yield serializers.serialize(
      object.filesScanned,
      specifiedType: const FullType(int),
    );
    yield r'errorsCount';
    yield serializers.serialize(
      object.errorsCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminDashboardLatestScan object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminDashboardLatestScanBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'scanId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scanId = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScanStatus),
          ) as ScanStatus;
          result.status = valueDes;
          break;
        case r'startedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.startedAt = valueDes;
          break;
        case r'finishedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.finishedAt = valueDes;
          break;
        case r'filesScanned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.filesScanned = valueDes;
          break;
        case r'errorsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.errorsCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminDashboardLatestScan deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminDashboardLatestScanBuilder();
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


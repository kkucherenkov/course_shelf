//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scan_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_library_list_item_scan.g.dart';

/// Compact scan summary embedded in `AdminLibraryListItem`. Excludes scanId / filesScanned / coursesAdded — the libraries-list row only renders status + age + errors. The detail page fetches the full scan history via `listAdminScans?libraryId=…`.
///
/// Properties:
/// * [status] 
/// * [startedAt] 
/// * [finishedAt] 
/// * [errorsCount] 
@BuiltValue()
abstract class AdminLibraryListItemScan implements Built<AdminLibraryListItemScan, AdminLibraryListItemScanBuilder> {
  @BuiltValueField(wireName: r'status')
  ScanStatus get status;
  // enum statusEnum {  running,  succeeded,  failed,  cancelled,  };

  @BuiltValueField(wireName: r'startedAt')
  DateTime get startedAt;

  @BuiltValueField(wireName: r'finishedAt')
  DateTime? get finishedAt;

  @BuiltValueField(wireName: r'errorsCount')
  int get errorsCount;

  AdminLibraryListItemScan._();

  factory AdminLibraryListItemScan([void updates(AdminLibraryListItemScanBuilder b)]) = _$AdminLibraryListItemScan;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminLibraryListItemScanBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminLibraryListItemScan> get serializer => _$AdminLibraryListItemScanSerializer();
}

class _$AdminLibraryListItemScanSerializer implements PrimitiveSerializer<AdminLibraryListItemScan> {
  @override
  final Iterable<Type> types = const [AdminLibraryListItemScan, _$AdminLibraryListItemScan];

  @override
  final String wireName = r'AdminLibraryListItemScan';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminLibraryListItemScan object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'errorsCount';
    yield serializers.serialize(
      object.errorsCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminLibraryListItemScan object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminLibraryListItemScanBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
  AdminLibraryListItemScan deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminLibraryListItemScanBuilder();
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


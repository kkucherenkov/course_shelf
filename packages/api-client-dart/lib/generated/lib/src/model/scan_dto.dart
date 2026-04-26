//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scan_status.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/scan_error.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scan_dto.g.dart';

/// A scan record for a library, produced by the Scan aggregate.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this scan.
/// * [libraryId] - cuid of the library that was scanned.
/// * [status] 
/// * [startedAt] - ISO-8601 instant when the scan was started.
/// * [finishedAt] - Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
/// * [filesScanned] - Total number of filesystem entries inspected.
/// * [filesAdded] - Files that did not exist in the catalog before this scan.
/// * [filesUpdated] - Files whose metadata changed since the last scan.
/// * [coursesDiscovered] - Course roots detected during this scan.
/// * [errors] - Non-fatal per-file errors encountered during the scan.
@BuiltValue()
abstract class ScanDto implements Built<ScanDto, ScanDtoBuilder> {
  /// Server-generated cuid identifying this scan.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the library that was scanned.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  @BuiltValueField(wireName: r'status')
  ScanStatus get status;
  // enum statusEnum {  running,  succeeded,  failed,  cancelled,  };

  /// ISO-8601 instant when the scan was started.
  @BuiltValueField(wireName: r'startedAt')
  DateTime get startedAt;

  /// Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
  @BuiltValueField(wireName: r'finishedAt')
  DateTime? get finishedAt;

  /// Total number of filesystem entries inspected.
  @BuiltValueField(wireName: r'filesScanned')
  int get filesScanned;

  /// Files that did not exist in the catalog before this scan.
  @BuiltValueField(wireName: r'filesAdded')
  int get filesAdded;

  /// Files whose metadata changed since the last scan.
  @BuiltValueField(wireName: r'filesUpdated')
  int get filesUpdated;

  /// Course roots detected during this scan.
  @BuiltValueField(wireName: r'coursesDiscovered')
  int get coursesDiscovered;

  /// Non-fatal per-file errors encountered during the scan.
  @BuiltValueField(wireName: r'errors')
  BuiltList<ScanError> get errors;

  ScanDto._();

  factory ScanDto([void updates(ScanDtoBuilder b)]) = _$ScanDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScanDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScanDto> get serializer => _$ScanDtoSerializer();
}

class _$ScanDtoSerializer implements PrimitiveSerializer<ScanDto> {
  @override
  final Iterable<Type> types = const [ScanDto, _$ScanDto];

  @override
  final String wireName = r'ScanDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScanDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
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
    if (object.finishedAt != null) {
      yield r'finishedAt';
      yield serializers.serialize(
        object.finishedAt,
        specifiedType: const FullType(DateTime),
      );
    }
    yield r'filesScanned';
    yield serializers.serialize(
      object.filesScanned,
      specifiedType: const FullType(int),
    );
    yield r'filesAdded';
    yield serializers.serialize(
      object.filesAdded,
      specifiedType: const FullType(int),
    );
    yield r'filesUpdated';
    yield serializers.serialize(
      object.filesUpdated,
      specifiedType: const FullType(int),
    );
    yield r'coursesDiscovered';
    yield serializers.serialize(
      object.coursesDiscovered,
      specifiedType: const FullType(int),
    );
    yield r'errors';
    yield serializers.serialize(
      object.errors,
      specifiedType: const FullType(BuiltList, [FullType(ScanError)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ScanDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScanDtoBuilder result,
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
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.finishedAt = valueDes;
          break;
        case r'filesScanned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.filesScanned = valueDes;
          break;
        case r'filesAdded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.filesAdded = valueDes;
          break;
        case r'filesUpdated':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.filesUpdated = valueDes;
          break;
        case r'coursesDiscovered':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.coursesDiscovered = valueDes;
          break;
        case r'errors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ScanError)]),
          ) as BuiltList<ScanError>;
          result.errors.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScanDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScanDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scan_status.g.dart';

class ScanStatus extends EnumClass {

  /// Scan lifecycle. `cancelled` is reserved for v2 admin-cancel; v1 scans only ever transition `running → {succeeded, failed}`.
  @BuiltValueEnumConst(wireName: r'running')
  static const ScanStatus running = _$running;
  /// Scan lifecycle. `cancelled` is reserved for v2 admin-cancel; v1 scans only ever transition `running → {succeeded, failed}`.
  @BuiltValueEnumConst(wireName: r'succeeded')
  static const ScanStatus succeeded = _$succeeded;
  /// Scan lifecycle. `cancelled` is reserved for v2 admin-cancel; v1 scans only ever transition `running → {succeeded, failed}`.
  @BuiltValueEnumConst(wireName: r'failed')
  static const ScanStatus failed = _$failed;
  /// Scan lifecycle. `cancelled` is reserved for v2 admin-cancel; v1 scans only ever transition `running → {succeeded, failed}`.
  @BuiltValueEnumConst(wireName: r'cancelled')
  static const ScanStatus cancelled = _$cancelled;

  static Serializer<ScanStatus> get serializer => _$scanStatusSerializer;

  const ScanStatus._(String name): super(name);

  static BuiltSet<ScanStatus> get values => _$values;
  static ScanStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ScanStatusMixin = Object with _$ScanStatusMixin;


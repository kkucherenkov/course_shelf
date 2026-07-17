//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dependency_status.g.dart';

class DependencyStatus extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ok')
  static const DependencyStatus ok = _$ok;
  @BuiltValueEnumConst(wireName: r'degraded')
  static const DependencyStatus degraded = _$degraded;
  @BuiltValueEnumConst(wireName: r'down')
  static const DependencyStatus down = _$down;

  static Serializer<DependencyStatus> get serializer => _$dependencyStatusSerializer;

  const DependencyStatus._(String name): super(name);

  static BuiltSet<DependencyStatus> get values => _$values;
  static DependencyStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class DependencyStatusMixin = Object with _$DependencyStatusMixin;


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'identify_task_status.g.dart';

class IdentifyTaskStatus extends EnumClass {

  /// Lifecycle state of an identify task.
  @BuiltValueEnumConst(wireName: r'proposed')
  static const IdentifyTaskStatus proposed = _$proposed;
  /// Lifecycle state of an identify task.
  @BuiltValueEnumConst(wireName: r'applied')
  static const IdentifyTaskStatus applied = _$applied;
  /// Lifecycle state of an identify task.
  @BuiltValueEnumConst(wireName: r'discarded')
  static const IdentifyTaskStatus discarded = _$discarded;

  static Serializer<IdentifyTaskStatus> get serializer => _$identifyTaskStatusSerializer;

  const IdentifyTaskStatus._(String name): super(name);

  static BuiltSet<IdentifyTaskStatus> get values => _$values;
  static IdentifyTaskStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class IdentifyTaskStatusMixin = Object with _$IdentifyTaskStatusMixin;


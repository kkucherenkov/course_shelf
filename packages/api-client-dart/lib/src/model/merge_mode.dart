//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'merge_mode.g.dart';

class MergeMode extends EnumClass {

  /// How one field reconciles scraped vs existing values. `merge` fills empty scalars / unions arrays; `overwrite` replaces; `ignore` leaves unchanged.
  @BuiltValueEnumConst(wireName: r'merge')
  static const MergeMode merge = _$merge;
  /// How one field reconciles scraped vs existing values. `merge` fills empty scalars / unions arrays; `overwrite` replaces; `ignore` leaves unchanged.
  @BuiltValueEnumConst(wireName: r'overwrite')
  static const MergeMode overwrite = _$overwrite;
  /// How one field reconciles scraped vs existing values. `merge` fills empty scalars / unions arrays; `overwrite` replaces; `ignore` leaves unchanged.
  @BuiltValueEnumConst(wireName: r'ignore')
  static const MergeMode ignore = _$ignore;

  static Serializer<MergeMode> get serializer => _$mergeModeSerializer;

  const MergeMode._(String name): super(name);

  static BuiltSet<MergeMode> get values => _$values;
  static MergeMode valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class MergeModeMixin = Object with _$MergeModeMixin;


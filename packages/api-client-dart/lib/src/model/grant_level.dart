//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'grant_level.g.dart';

class GrantLevel extends EnumClass {

  /// Access level. v1 only issues READ; the enum is open for future levels (e.g. ADMIN, NONE for explicit denials).
  @BuiltValueEnumConst(wireName: r'READ')
  static const GrantLevel READ = _$READ;

  static Serializer<GrantLevel> get serializer => _$grantLevelSerializer;

  const GrantLevel._(String name): super(name);

  static BuiltSet<GrantLevel> get values => _$values;
  static GrantLevel valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class GrantLevelMixin = Object with _$GrantLevelMixin;


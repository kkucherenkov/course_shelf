//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scraper_origin.g.dart';

class ScraperOrigin extends EnumClass {

  /// Where a scraper's implementation came from: `built-in` ships with the backend, `definition-file` was loaded from a scraper definition file on this instance.
  @BuiltValueEnumConst(wireName: r'built-in')
  static const ScraperOrigin builtIn = _$builtIn;
  /// Where a scraper's implementation came from: `built-in` ships with the backend, `definition-file` was loaded from a scraper definition file on this instance.
  @BuiltValueEnumConst(wireName: r'definition-file')
  static const ScraperOrigin definitionFile = _$definitionFile;

  static Serializer<ScraperOrigin> get serializer => _$scraperOriginSerializer;

  const ScraperOrigin._(String name): super(name);

  static BuiltSet<ScraperOrigin> get values => _$values;
  static ScraperOrigin valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ScraperOriginMixin = Object with _$ScraperOriginMixin;


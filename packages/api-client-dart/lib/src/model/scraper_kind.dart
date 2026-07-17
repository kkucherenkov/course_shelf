//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scraper_kind.g.dart';

class ScraperKind extends EnumClass {

  /// Invocation kind for the scrape-preview endpoint. `url` — fetch and parse a remote URL; `name` — search the source by course title; `fragment` — parse a raw HTML or JSON-LD string supplied by the caller.
  @BuiltValueEnumConst(wireName: r'url')
  static const ScraperKind url = _$url;
  /// Invocation kind for the scrape-preview endpoint. `url` — fetch and parse a remote URL; `name` — search the source by course title; `fragment` — parse a raw HTML or JSON-LD string supplied by the caller.
  @BuiltValueEnumConst(wireName: r'name')
  static const ScraperKind nameKind = _$nameKind;
  /// Invocation kind for the scrape-preview endpoint. `url` — fetch and parse a remote URL; `name` — search the source by course title; `fragment` — parse a raw HTML or JSON-LD string supplied by the caller.
  @BuiltValueEnumConst(wireName: r'fragment')
  static const ScraperKind fragment = _$fragment;

  static Serializer<ScraperKind> get serializer => _$scraperKindSerializer;

  const ScraperKind._(String name): super(name);

  static BuiltSet<ScraperKind> get values => _$values;
  static ScraperKind valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ScraperKindMixin = Object with _$ScraperKindMixin;


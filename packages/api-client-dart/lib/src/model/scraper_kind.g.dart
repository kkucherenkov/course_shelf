// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scraper_kind.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ScraperKind _$url = const ScraperKind._('url');
const ScraperKind _$nameKind = const ScraperKind._('nameKind');
const ScraperKind _$fragment = const ScraperKind._('fragment');

ScraperKind _$valueOf(String name) {
  switch (name) {
    case 'url':
      return _$url;
    case 'nameKind':
      return _$nameKind;
    case 'fragment':
      return _$fragment;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ScraperKind> _$values = BuiltSet<ScraperKind>(
  const <ScraperKind>[_$url, _$nameKind, _$fragment],
);

class _$ScraperKindMeta {
  const _$ScraperKindMeta();
  ScraperKind get url => _$url;
  ScraperKind get nameKind => _$nameKind;
  ScraperKind get fragment => _$fragment;
  ScraperKind valueOf(String name) => _$valueOf(name);
  BuiltSet<ScraperKind> get values => _$values;
}

mixin _$ScraperKindMixin {
  // ignore: non_constant_identifier_names
  _$ScraperKindMeta get ScraperKind => const _$ScraperKindMeta();
}

Serializer<ScraperKind> _$scraperKindSerializer = _$ScraperKindSerializer();

class _$ScraperKindSerializer implements PrimitiveSerializer<ScraperKind> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'url': 'url',
    'nameKind': 'name',
    'fragment': 'fragment',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'url': 'url',
    'name': 'nameKind',
    'fragment': 'fragment',
  };

  @override
  final Iterable<Type> types = const <Type>[ScraperKind];
  @override
  final String wireName = 'ScraperKind';

  @override
  Object serialize(
    Serializers serializers,
    ScraperKind object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  ScraperKind deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => ScraperKind.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scraper_origin.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ScraperOrigin _$builtIn = const ScraperOrigin._('builtIn');
const ScraperOrigin _$definitionFile = const ScraperOrigin._('definitionFile');

ScraperOrigin _$valueOf(String name) {
  switch (name) {
    case 'builtIn':
      return _$builtIn;
    case 'definitionFile':
      return _$definitionFile;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ScraperOrigin> _$values = BuiltSet<ScraperOrigin>(
  const <ScraperOrigin>[_$builtIn, _$definitionFile],
);

class _$ScraperOriginMeta {
  const _$ScraperOriginMeta();
  ScraperOrigin get builtIn => _$builtIn;
  ScraperOrigin get definitionFile => _$definitionFile;
  ScraperOrigin valueOf(String name) => _$valueOf(name);
  BuiltSet<ScraperOrigin> get values => _$values;
}

mixin _$ScraperOriginMixin {
  // ignore: non_constant_identifier_names
  _$ScraperOriginMeta get ScraperOrigin => const _$ScraperOriginMeta();
}

Serializer<ScraperOrigin> _$scraperOriginSerializer =
    _$ScraperOriginSerializer();

class _$ScraperOriginSerializer implements PrimitiveSerializer<ScraperOrigin> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'builtIn': 'built-in',
    'definitionFile': 'definition-file',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'built-in': 'builtIn',
    'definition-file': 'definitionFile',
  };

  @override
  final Iterable<Type> types = const <Type>[ScraperOrigin];
  @override
  final String wireName = 'ScraperOrigin';

  @override
  Object serialize(
    Serializers serializers,
    ScraperOrigin object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  ScraperOrigin deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => ScraperOrigin.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

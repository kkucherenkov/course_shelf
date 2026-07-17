// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_kind.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MaterialKind _$doc = const MaterialKind._('doc');
const MaterialKind _$note = const MaterialKind._('note');
const MaterialKind _$image = const MaterialKind._('image');
const MaterialKind _$slide = const MaterialKind._('slide');

MaterialKind _$valueOf(String name) {
  switch (name) {
    case 'doc':
      return _$doc;
    case 'note':
      return _$note;
    case 'image':
      return _$image;
    case 'slide':
      return _$slide;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MaterialKind> _$values = BuiltSet<MaterialKind>(
  const <MaterialKind>[_$doc, _$note, _$image, _$slide],
);

class _$MaterialKindMeta {
  const _$MaterialKindMeta();
  MaterialKind get doc => _$doc;
  MaterialKind get note => _$note;
  MaterialKind get image => _$image;
  MaterialKind get slide => _$slide;
  MaterialKind valueOf(String name) => _$valueOf(name);
  BuiltSet<MaterialKind> get values => _$values;
}

mixin _$MaterialKindMixin {
  // ignore: non_constant_identifier_names
  _$MaterialKindMeta get MaterialKind => const _$MaterialKindMeta();
}

Serializer<MaterialKind> _$materialKindSerializer = _$MaterialKindSerializer();

class _$MaterialKindSerializer implements PrimitiveSerializer<MaterialKind> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'doc': 'doc',
    'note': 'note',
    'image': 'image',
    'slide': 'slide',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'doc': 'doc',
    'note': 'note',
    'image': 'image',
    'slide': 'slide',
  };

  @override
  final Iterable<Type> types = const <Type>[MaterialKind];
  @override
  final String wireName = 'MaterialKind';

  @override
  Object serialize(
    Serializers serializers,
    MaterialKind object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  MaterialKind deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => MaterialKind.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

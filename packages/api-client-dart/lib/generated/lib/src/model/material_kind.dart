//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'material_kind.g.dart';

class MaterialKind extends EnumClass {

  /// Coarse classification of a sidecar material. `doc` is `.pdf`, `note` is `.md` / `.txt`, `image` is `.png` / `.jpg`, `slide` is reserved for future use.
  @BuiltValueEnumConst(wireName: r'doc')
  static const MaterialKind doc = _$doc;
  /// Coarse classification of a sidecar material. `doc` is `.pdf`, `note` is `.md` / `.txt`, `image` is `.png` / `.jpg`, `slide` is reserved for future use.
  @BuiltValueEnumConst(wireName: r'note')
  static const MaterialKind note = _$note;
  /// Coarse classification of a sidecar material. `doc` is `.pdf`, `note` is `.md` / `.txt`, `image` is `.png` / `.jpg`, `slide` is reserved for future use.
  @BuiltValueEnumConst(wireName: r'image')
  static const MaterialKind image = _$image;
  /// Coarse classification of a sidecar material. `doc` is `.pdf`, `note` is `.md` / `.txt`, `image` is `.png` / `.jpg`, `slide` is reserved for future use.
  @BuiltValueEnumConst(wireName: r'slide')
  static const MaterialKind slide = _$slide;

  static Serializer<MaterialKind> get serializer => _$materialKindSerializer;

  const MaterialKind._(String name): super(name);

  static BuiltSet<MaterialKind> get values => _$values;
  static MaterialKind valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class MaterialKindMixin = Object with _$MaterialKindMixin;


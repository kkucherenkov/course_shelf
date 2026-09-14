//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_ref.g.dart';

/// Lightweight reference to a tag, embedded in CourseDto.
///
/// Properties:
/// * [id] - Server-generated cuid of the tag.
/// * [slug] - URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates.
/// * [displayName] 
/// * [category] 
@BuiltValue()
abstract class TagRef implements Built<TagRef, TagRefBuilder> {
  /// Server-generated cuid of the tag.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates.
  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'category')
  String? get category;

  TagRef._();

  factory TagRef([void updates(TagRefBuilder b)]) = _$TagRef;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagRefBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagRef> get serializer => _$TagRefSerializer();
}

class _$TagRefSerializer implements PrimitiveSerializer<TagRef> {
  @override
  final Iterable<Type> types = const [TagRef, _$TagRef];

  @override
  final String wireName = r'TagRef';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagRef object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'slug';
    yield serializers.serialize(
      object.slug,
      specifiedType: const FullType(String),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    if (object.category != null) {
      yield r'category';
      yield serializers.serialize(
        object.category,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TagRef object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagRefBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'category':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.category = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TagRef deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagRefBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}


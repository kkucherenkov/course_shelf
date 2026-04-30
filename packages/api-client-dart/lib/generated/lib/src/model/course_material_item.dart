//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_material_item.g.dart';

/// One sidecar material aggregated at the course level. The `materials[]` list returned by `getCourseOutline` is sorted by `(section.position, lesson.position, material.id)` so consecutive items belong to the same section — the right-rail groups them by `sectionId` and renders a small caption per cluster.  `sectionTitle` is included so the rail can render the caption without a per-item lookup against the outline's `sections[]`. 
///
/// Properties:
/// * [id] 
/// * [lessonId] - Owning lesson id. Used by the right-rail to link to the lesson.
/// * [sectionId] - Owning section id. Used by the rail to group items.
/// * [sectionTitle] - Title of the owning section, denormalised so the rail can render its grouping caption without resolving via `sections[]`.
/// * [kind] 
/// * [label] 
/// * [sizeBytes] 
@BuiltValue()
abstract class CourseMaterialItem implements Built<CourseMaterialItem, CourseMaterialItemBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Owning lesson id. Used by the right-rail to link to the lesson.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Owning section id. Used by the rail to group items.
  @BuiltValueField(wireName: r'sectionId')
  String get sectionId;

  /// Title of the owning section, denormalised so the rail can render its grouping caption without resolving via `sections[]`.
  @BuiltValueField(wireName: r'sectionTitle')
  String get sectionTitle;

  @BuiltValueField(wireName: r'kind')
  CourseMaterialItemKindEnum get kind;
  // enum kindEnum {  doc,  note,  image,  slide,  };

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'sizeBytes')
  int get sizeBytes;

  CourseMaterialItem._();

  factory CourseMaterialItem([void updates(CourseMaterialItemBuilder b)]) = _$CourseMaterialItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseMaterialItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseMaterialItem> get serializer => _$CourseMaterialItemSerializer();
}

class _$CourseMaterialItemSerializer implements PrimitiveSerializer<CourseMaterialItem> {
  @override
  final Iterable<Type> types = const [CourseMaterialItem, _$CourseMaterialItem];

  @override
  final String wireName = r'CourseMaterialItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseMaterialItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'sectionId';
    yield serializers.serialize(
      object.sectionId,
      specifiedType: const FullType(String),
    );
    yield r'sectionTitle';
    yield serializers.serialize(
      object.sectionTitle,
      specifiedType: const FullType(String),
    );
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(CourseMaterialItemKindEnum),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseMaterialItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseMaterialItemBuilder result,
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
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'sectionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sectionId = valueDes;
          break;
        case r'sectionTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sectionTitle = valueDes;
          break;
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseMaterialItemKindEnum),
          ) as CourseMaterialItemKindEnum;
          result.kind = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.sizeBytes = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseMaterialItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseMaterialItemBuilder();
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

class CourseMaterialItemKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'doc')
  static const CourseMaterialItemKindEnum doc = _$courseMaterialItemKindEnum_doc;
  @BuiltValueEnumConst(wireName: r'note')
  static const CourseMaterialItemKindEnum note = _$courseMaterialItemKindEnum_note;
  @BuiltValueEnumConst(wireName: r'image')
  static const CourseMaterialItemKindEnum image = _$courseMaterialItemKindEnum_image;
  @BuiltValueEnumConst(wireName: r'slide')
  static const CourseMaterialItemKindEnum slide = _$courseMaterialItemKindEnum_slide;

  static Serializer<CourseMaterialItemKindEnum> get serializer => _$courseMaterialItemKindEnumSerializer;

  const CourseMaterialItemKindEnum._(String name): super(name);

  static BuiltSet<CourseMaterialItemKindEnum> get values => _$courseMaterialItemKindEnumValues;
  static CourseMaterialItemKindEnum valueOf(String name) => _$courseMaterialItemKindEnumValueOf(name);
}


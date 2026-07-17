//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_lesson_hit.g.dart';

/// SearchLessonHit
///
/// Properties:
/// * [id] 
/// * [courseId] 
/// * [courseTitle] - Title of the parent course — included so the SPA can show breadcrumb context.
/// * [sectionTitle] - Title of the parent section.
/// * [title] 
/// * [position] 
@BuiltValue()
abstract class SearchLessonHit implements Built<SearchLessonHit, SearchLessonHitBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Title of the parent course — included so the SPA can show breadcrumb context.
  @BuiltValueField(wireName: r'courseTitle')
  String get courseTitle;

  /// Title of the parent section.
  @BuiltValueField(wireName: r'sectionTitle')
  String get sectionTitle;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'position')
  int get position;

  SearchLessonHit._();

  factory SearchLessonHit([void updates(SearchLessonHitBuilder b)]) = _$SearchLessonHit;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchLessonHitBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchLessonHit> get serializer => _$SearchLessonHitSerializer();
}

class _$SearchLessonHitSerializer implements PrimitiveSerializer<SearchLessonHit> {
  @override
  final Iterable<Type> types = const [SearchLessonHit, _$SearchLessonHit];

  @override
  final String wireName = r'SearchLessonHit';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchLessonHit object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'courseTitle';
    yield serializers.serialize(
      object.courseTitle,
      specifiedType: const FullType(String),
    );
    yield r'sectionTitle';
    yield serializers.serialize(
      object.sectionTitle,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchLessonHit object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchLessonHitBuilder result,
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
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'courseTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseTitle = valueDes;
          break;
        case r'sectionTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sectionTitle = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.position = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchLessonHit deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchLessonHitBuilder();
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


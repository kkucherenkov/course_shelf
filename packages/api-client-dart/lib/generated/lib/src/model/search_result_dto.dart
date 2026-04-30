//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/search_lesson_hit.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/search_course_hit.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_result_dto.g.dart';

/// Two result lists for a single search query — one of course hits and one of lesson hits. The shape is intentionally not unified because each kind needs different context fields (lesson hits carry their parent course/section so the SPA can show breadcrumb- style context).
///
/// Properties:
/// * [query] - The trimmed query string the server matched against.
/// * [courses] 
/// * [lessons] 
@BuiltValue()
abstract class SearchResultDto implements Built<SearchResultDto, SearchResultDtoBuilder> {
  /// The trimmed query string the server matched against.
  @BuiltValueField(wireName: r'query')
  String get query;

  @BuiltValueField(wireName: r'courses')
  BuiltList<SearchCourseHit> get courses;

  @BuiltValueField(wireName: r'lessons')
  BuiltList<SearchLessonHit> get lessons;

  SearchResultDto._();

  factory SearchResultDto([void updates(SearchResultDtoBuilder b)]) = _$SearchResultDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchResultDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchResultDto> get serializer => _$SearchResultDtoSerializer();
}

class _$SearchResultDtoSerializer implements PrimitiveSerializer<SearchResultDto> {
  @override
  final Iterable<Type> types = const [SearchResultDto, _$SearchResultDto];

  @override
  final String wireName = r'SearchResultDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchResultDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'query';
    yield serializers.serialize(
      object.query,
      specifiedType: const FullType(String),
    );
    yield r'courses';
    yield serializers.serialize(
      object.courses,
      specifiedType: const FullType(BuiltList, [FullType(SearchCourseHit)]),
    );
    yield r'lessons';
    yield serializers.serialize(
      object.lessons,
      specifiedType: const FullType(BuiltList, [FullType(SearchLessonHit)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchResultDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchResultDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'query':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.query = valueDes;
          break;
        case r'courses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchCourseHit)]),
          ) as BuiltList<SearchCourseHit>;
          result.courses.replace(valueDes);
          break;
        case r'lessons':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchLessonHit)]),
          ) as BuiltList<SearchLessonHit>;
          result.lessons.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchResultDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchResultDtoBuilder();
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


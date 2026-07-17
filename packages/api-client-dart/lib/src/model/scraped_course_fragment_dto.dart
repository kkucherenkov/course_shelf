//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/date.dart';
import 'package:app_api_client/src/model/course_level.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scraped_course_fragment_dto.g.dart';

/// Raw scraped metadata. Names are not resolved to entities (Stage 4 does that). All fields are optional because any given scraper may return a partial set.
///
/// Properties:
/// * [title] - Raw course title as returned by the scraper.
/// * [description] - Raw course description.
/// * [instructorNames] - Instructor names as scraped (not resolved to Instructor entities).
/// * [studioName] - Studio or channel name as scraped (not resolved to a Studio entity).
/// * [tags] - Raw tags or topic labels.
/// * [level] 
/// * [language] - BCP-47 language code (e.g. `en`, `de`).
/// * [releaseDate] - Original release date of the course in ISO 8601 date format.
/// * [posterUrl] - URL of the course thumbnail / poster image.
/// * [externalIds] - External system references detected during scraping.
/// * [ratingAverage] - Aggregate rating value in the range [0, 5].
/// * [ratingCount] - Number of ratings that make up the aggregate.
@BuiltValue()
abstract class ScrapedCourseFragmentDto implements Built<ScrapedCourseFragmentDto, ScrapedCourseFragmentDtoBuilder> {
  /// Raw course title as returned by the scraper.
  @BuiltValueField(wireName: r'title')
  String? get title;

  /// Raw course description.
  @BuiltValueField(wireName: r'description')
  String? get description;

  /// Instructor names as scraped (not resolved to Instructor entities).
  @BuiltValueField(wireName: r'instructorNames')
  BuiltList<String>? get instructorNames;

  /// Studio or channel name as scraped (not resolved to a Studio entity).
  @BuiltValueField(wireName: r'studioName')
  String? get studioName;

  /// Raw tags or topic labels.
  @BuiltValueField(wireName: r'tags')
  BuiltList<String>? get tags;

  @BuiltValueField(wireName: r'level')
  CourseLevel? get level;
  // enum levelEnum {  beginner,  intermediate,  advanced,  expert,  all_levels,  };

  /// BCP-47 language code (e.g. `en`, `de`).
  @BuiltValueField(wireName: r'language')
  String? get language;

  /// Original release date of the course in ISO 8601 date format.
  @BuiltValueField(wireName: r'releaseDate')
  Date? get releaseDate;

  /// URL of the course thumbnail / poster image.
  @BuiltValueField(wireName: r'posterUrl')
  String? get posterUrl;

  /// External system references detected during scraping.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  /// Aggregate rating value in the range [0, 5].
  @BuiltValueField(wireName: r'ratingAverage')
  double? get ratingAverage;

  /// Number of ratings that make up the aggregate.
  @BuiltValueField(wireName: r'ratingCount')
  int? get ratingCount;

  ScrapedCourseFragmentDto._();

  factory ScrapedCourseFragmentDto([void updates(ScrapedCourseFragmentDtoBuilder b)]) = _$ScrapedCourseFragmentDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScrapedCourseFragmentDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScrapedCourseFragmentDto> get serializer => _$ScrapedCourseFragmentDtoSerializer();
}

class _$ScrapedCourseFragmentDtoSerializer implements PrimitiveSerializer<ScrapedCourseFragmentDto> {
  @override
  final Iterable<Type> types = const [ScrapedCourseFragmentDto, _$ScrapedCourseFragmentDto];

  @override
  final String wireName = r'ScrapedCourseFragmentDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScrapedCourseFragmentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.instructorNames != null) {
      yield r'instructorNames';
      yield serializers.serialize(
        object.instructorNames,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.studioName != null) {
      yield r'studioName';
      yield serializers.serialize(
        object.studioName,
        specifiedType: const FullType(String),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.level != null) {
      yield r'level';
      yield serializers.serialize(
        object.level,
        specifiedType: const FullType(CourseLevel),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(String),
      );
    }
    if (object.releaseDate != null) {
      yield r'releaseDate';
      yield serializers.serialize(
        object.releaseDate,
        specifiedType: const FullType(Date),
      );
    }
    if (object.posterUrl != null) {
      yield r'posterUrl';
      yield serializers.serialize(
        object.posterUrl,
        specifiedType: const FullType(String),
      );
    }
    if (object.externalIds != null) {
      yield r'externalIds';
      yield serializers.serialize(
        object.externalIds,
        specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
      );
    }
    if (object.ratingAverage != null) {
      yield r'ratingAverage';
      yield serializers.serialize(
        object.ratingAverage,
        specifiedType: const FullType(double),
      );
    }
    if (object.ratingCount != null) {
      yield r'ratingCount';
      yield serializers.serialize(
        object.ratingCount,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ScrapedCourseFragmentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScrapedCourseFragmentDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'instructorNames':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.instructorNames.replace(valueDes);
          break;
        case r'studioName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.studioName = valueDes;
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tags.replace(valueDes);
          break;
        case r'level':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseLevel),
          ) as CourseLevel;
          result.level = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.language = valueDes;
          break;
        case r'releaseDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Date),
          ) as Date;
          result.releaseDate = valueDes;
          break;
        case r'posterUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.posterUrl = valueDes;
          break;
        case r'externalIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
          ) as BuiltList<ExternalIdRef>;
          result.externalIds.replace(valueDes);
          break;
        case r'ratingAverage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.ratingAverage = valueDes;
          break;
        case r'ratingCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.ratingCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScrapedCourseFragmentDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScrapedCourseFragmentDtoBuilder();
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


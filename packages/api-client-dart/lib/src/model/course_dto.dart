//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:app_api_client/src/model/course_progress.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/tag_ref.dart';
import 'package:app_api_client/src/model/date.dart';
import 'package:app_api_client/src/model/instructor_ref.dart';
import 'package:app_api_client/src/model/course_level.dart';
import 'package:app_api_client/src/model/studio_ref.dart';
import 'package:app_api_client/src/model/section_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_dto.g.dart';

/// Full representation of a Course aggregate.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this course.
/// * [libraryId] - cuid of the library this course belongs to.
/// * [slug] - URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
/// * [title] 
/// * [description] 
/// * [sections] - Sections sorted ascending by position.
/// * [progress] 
/// * [instructors] - Instructors associated with this course. Empty array when none linked.
/// * [studios] - Studios associated with this course. Empty array when none linked.
/// * [tags] - Tags associated with this course. Empty array when none linked.
/// * [level] 
/// * [language] 
/// * [releaseDate] 
/// * [posterUrl] 
/// * [ratingAverage] 
/// * [ratingCount] 
/// * [externalIds] - External system references for this course. Empty array when none.
/// * [sourceUpdatedAt] 
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class CourseDto implements Built<CourseDto, CourseDtoBuilder> {
  /// Server-generated cuid identifying this course.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the library this course belongs to.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  /// URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  /// Sections sorted ascending by position.
  @BuiltValueField(wireName: r'sections')
  BuiltList<SectionDto> get sections;

  @BuiltValueField(wireName: r'progress')
  CourseProgress get progress;

  /// Instructors associated with this course. Empty array when none linked.
  @BuiltValueField(wireName: r'instructors')
  BuiltList<InstructorRef>? get instructors;

  /// Studios associated with this course. Empty array when none linked.
  @BuiltValueField(wireName: r'studios')
  BuiltList<StudioRef>? get studios;

  /// Tags associated with this course. Empty array when none linked.
  @BuiltValueField(wireName: r'tags')
  BuiltList<TagRef>? get tags;

  @BuiltValueField(wireName: r'level')
  CourseLevel? get level;
  // enum levelEnum {  beginner,  intermediate,  advanced,  expert,  all_levels,  };

  @BuiltValueField(wireName: r'language')
  String? get language;

  @BuiltValueField(wireName: r'releaseDate')
  Date? get releaseDate;

  @BuiltValueField(wireName: r'posterUrl')
  String? get posterUrl;

  @BuiltValueField(wireName: r'ratingAverage')
  num? get ratingAverage;

  @BuiltValueField(wireName: r'ratingCount')
  int? get ratingCount;

  /// External system references for this course. Empty array when none.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  @BuiltValueField(wireName: r'sourceUpdatedAt')
  DateTime? get sourceUpdatedAt;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  CourseDto._();

  factory CourseDto([void updates(CourseDtoBuilder b)]) = _$CourseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseDtoBuilder b) => b
      ..instructors = ListBuilder()
      ..studios = ListBuilder()
      ..tags = ListBuilder()
      ..externalIds = ListBuilder();

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseDto> get serializer => _$CourseDtoSerializer();
}

class _$CourseDtoSerializer implements PrimitiveSerializer<CourseDto> {
  @override
  final Iterable<Type> types = const [CourseDto, _$CourseDto];

  @override
  final String wireName = r'CourseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
    yield r'slug';
    yield serializers.serialize(
      object.slug,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    yield r'sections';
    yield serializers.serialize(
      object.sections,
      specifiedType: const FullType(BuiltList, [FullType(SectionDto)]),
    );
    yield r'progress';
    yield serializers.serialize(
      object.progress,
      specifiedType: const FullType(CourseProgress),
    );
    if (object.instructors != null) {
      yield r'instructors';
      yield serializers.serialize(
        object.instructors,
        specifiedType: const FullType(BuiltList, [FullType(InstructorRef)]),
      );
    }
    if (object.studios != null) {
      yield r'studios';
      yield serializers.serialize(
        object.studios,
        specifiedType: const FullType(BuiltList, [FullType(StudioRef)]),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(BuiltList, [FullType(TagRef)]),
      );
    }
    if (object.level != null) {
      yield r'level';
      yield serializers.serialize(
        object.level,
        specifiedType: const FullType.nullable(CourseLevel),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.releaseDate != null) {
      yield r'releaseDate';
      yield serializers.serialize(
        object.releaseDate,
        specifiedType: const FullType.nullable(Date),
      );
    }
    if (object.posterUrl != null) {
      yield r'posterUrl';
      yield serializers.serialize(
        object.posterUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.ratingAverage != null) {
      yield r'ratingAverage';
      yield serializers.serialize(
        object.ratingAverage,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.ratingCount != null) {
      yield r'ratingCount';
      yield serializers.serialize(
        object.ratingCount,
        specifiedType: const FullType.nullable(int),
      );
    }
    if (object.externalIds != null) {
      yield r'externalIds';
      yield serializers.serialize(
        object.externalIds,
        specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
      );
    }
    if (object.sourceUpdatedAt != null) {
      yield r'sourceUpdatedAt';
      yield serializers.serialize(
        object.sourceUpdatedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseDtoBuilder result,
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
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
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
        case r'sections':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SectionDto)]),
          ) as BuiltList<SectionDto>;
          result.sections.replace(valueDes);
          break;
        case r'progress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseProgress),
          ) as CourseProgress;
          result.progress.replace(valueDes);
          break;
        case r'instructors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(InstructorRef)]),
          ) as BuiltList<InstructorRef>;
          result.instructors.replace(valueDes);
          break;
        case r'studios':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(StudioRef)]),
          ) as BuiltList<StudioRef>;
          result.studios.replace(valueDes);
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(TagRef)]),
          ) as BuiltList<TagRef>;
          result.tags.replace(valueDes);
          break;
        case r'level':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(CourseLevel),
          ) as CourseLevel?;
          if (valueDes == null) continue;
          result.level = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.language = valueDes;
          break;
        case r'releaseDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(Date),
          ) as Date?;
          if (valueDes == null) continue;
          result.releaseDate = valueDes;
          break;
        case r'posterUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.posterUrl = valueDes;
          break;
        case r'ratingAverage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.ratingAverage = valueDes;
          break;
        case r'ratingCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.ratingCount = valueDes;
          break;
        case r'externalIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
          ) as BuiltList<ExternalIdRef>;
          result.externalIds.replace(valueDes);
          break;
        case r'sourceUpdatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.sourceUpdatedAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseDtoBuilder();
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


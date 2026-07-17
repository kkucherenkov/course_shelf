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

part 'update_course_request.g.dart';

/// Payload for updating course metadata. All fields are optional, but at least one of `title`, `description`, `slug`, `instructorIds`, `studioIds`, `tagIds`, `posterUrl`, `level`, `language`, `releaseDate`, `sourceUpdatedAt`, `ratingAverage`, `ratingCount`, or `externalIds` must be present (server-side validation rule — OpenAPI does not have a native \"at-least-one\" constraint).  **Set-replace semantics for relation arrays:** `null` means \"leave the existing set alone\"; `[]` (empty array) means \"remove all links\"; a non-empty array replaces the full set with exactly the listed ids. 
///
/// Properties:
/// * [title] 
/// * [description] 
/// * [slug] - URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
/// * [instructorIds] 
/// * [studioIds] 
/// * [tagIds] 
/// * [level] 
/// * [language] 
/// * [releaseDate] 
/// * [posterUrl] 
/// * [ratingAverage] 
/// * [ratingCount] 
/// * [externalIds] 
/// * [sourceUpdatedAt] 
@BuiltValue()
abstract class UpdateCourseRequest implements Built<UpdateCourseRequest, UpdateCourseRequestBuilder> {
  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  /// URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
  @BuiltValueField(wireName: r'slug')
  String? get slug;

  @BuiltValueField(wireName: r'instructorIds')
  BuiltList<String>? get instructorIds;

  @BuiltValueField(wireName: r'studioIds')
  BuiltList<String>? get studioIds;

  @BuiltValueField(wireName: r'tagIds')
  BuiltList<String>? get tagIds;

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

  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  @BuiltValueField(wireName: r'sourceUpdatedAt')
  DateTime? get sourceUpdatedAt;

  UpdateCourseRequest._();

  factory UpdateCourseRequest([void updates(UpdateCourseRequestBuilder b)]) = _$UpdateCourseRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateCourseRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateCourseRequest> get serializer => _$UpdateCourseRequestSerializer();
}

class _$UpdateCourseRequestSerializer implements PrimitiveSerializer<UpdateCourseRequest> {
  @override
  final Iterable<Type> types = const [UpdateCourseRequest, _$UpdateCourseRequest];

  @override
  final String wireName = r'UpdateCourseRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateCourseRequest object, {
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
    if (object.slug != null) {
      yield r'slug';
      yield serializers.serialize(
        object.slug,
        specifiedType: const FullType(String),
      );
    }
    if (object.instructorIds != null) {
      yield r'instructorIds';
      yield serializers.serialize(
        object.instructorIds,
        specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
      );
    }
    if (object.studioIds != null) {
      yield r'studioIds';
      yield serializers.serialize(
        object.studioIds,
        specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
      );
    }
    if (object.tagIds != null) {
      yield r'tagIds';
      yield serializers.serialize(
        object.tagIds,
        specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
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
        specifiedType: const FullType.nullable(BuiltList, [FullType(ExternalIdRef)]),
      );
    }
    if (object.sourceUpdatedAt != null) {
      yield r'sourceUpdatedAt';
      yield serializers.serialize(
        object.sourceUpdatedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateCourseRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateCourseRequestBuilder result,
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
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'instructorIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.instructorIds.replace(valueDes);
          break;
        case r'studioIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.studioIds.replace(valueDes);
          break;
        case r'tagIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.tagIds.replace(valueDes);
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
            specifiedType: const FullType.nullable(BuiltList, [FullType(ExternalIdRef)]),
          ) as BuiltList<ExternalIdRef>?;
          if (valueDes == null) continue;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateCourseRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateCourseRequestBuilder();
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


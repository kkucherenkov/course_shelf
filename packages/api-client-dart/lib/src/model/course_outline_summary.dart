//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/course_progress.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_outline_summary.g.dart';

/// Course-level fields surfaced in the page hero.
///
/// Properties:
/// * [id] - Server-generated cuid identifying the course.
/// * [title] 
/// * [slug] 
/// * [description] - Long-form description rendered under the title.
/// * [instructor] - Visible \"by …\" label. Optional — may be null until the catalog DTO grows the field.
/// * [librarySlug] - Slug of the parent library, included for breadcrumbs. Optional because Library has no slug field yet (same caveat as ContinueWatchingItem).
/// * [lessonsTotal] 
/// * [totalDurationSeconds] - Sum of `Lesson.duration` across the course (whole seconds).
/// * [progress] 
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class CourseOutlineSummary implements Built<CourseOutlineSummary, CourseOutlineSummaryBuilder> {
  /// Server-generated cuid identifying the course.
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'slug')
  String? get slug;

  /// Long-form description rendered under the title.
  @BuiltValueField(wireName: r'description')
  String? get description;

  /// Visible \"by …\" label. Optional — may be null until the catalog DTO grows the field.
  @BuiltValueField(wireName: r'instructor')
  String? get instructor;

  /// Slug of the parent library, included for breadcrumbs. Optional because Library has no slug field yet (same caveat as ContinueWatchingItem).
  @BuiltValueField(wireName: r'librarySlug')
  String? get librarySlug;

  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  /// Sum of `Lesson.duration` across the course (whole seconds).
  @BuiltValueField(wireName: r'totalDurationSeconds')
  int get totalDurationSeconds;

  @BuiltValueField(wireName: r'progress')
  CourseProgress get progress;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  CourseOutlineSummary._();

  factory CourseOutlineSummary([void updates(CourseOutlineSummaryBuilder b)]) = _$CourseOutlineSummary;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseOutlineSummaryBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseOutlineSummary> get serializer => _$CourseOutlineSummarySerializer();
}

class _$CourseOutlineSummarySerializer implements PrimitiveSerializer<CourseOutlineSummary> {
  @override
  final Iterable<Type> types = const [CourseOutlineSummary, _$CourseOutlineSummary];

  @override
  final String wireName = r'CourseOutlineSummary';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseOutlineSummary object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.slug != null) {
      yield r'slug';
      yield serializers.serialize(
        object.slug,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.instructor != null) {
      yield r'instructor';
      yield serializers.serialize(
        object.instructor,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.librarySlug != null) {
      yield r'librarySlug';
      yield serializers.serialize(
        object.librarySlug,
        specifiedType: const FullType(String),
      );
    }
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
    yield r'totalDurationSeconds';
    yield serializers.serialize(
      object.totalDurationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'progress';
    yield serializers.serialize(
      object.progress,
      specifiedType: const FullType(CourseProgress),
    );
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
    CourseOutlineSummary object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseOutlineSummaryBuilder result,
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
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'instructor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.instructor = valueDes;
          break;
        case r'librarySlug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.librarySlug = valueDes;
          break;
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        case r'totalDurationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalDurationSeconds = valueDes;
          break;
        case r'progress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CourseProgress),
          ) as CourseProgress;
          result.progress.replace(valueDes);
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
  CourseOutlineSummary deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseOutlineSummaryBuilder();
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


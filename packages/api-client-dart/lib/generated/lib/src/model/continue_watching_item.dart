//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'continue_watching_item.g.dart';

/// A single entry in the continue-watching row, sourced from the `CourseProgressReadModel` projection.
///
/// Properties:
/// * [courseId] - Server-generated cuid identifying the course.
/// * [courseTitle] - Display title of the course.
/// * [librarySlug] - Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet.
/// * [percent] - Course completion = `lessonsCompleted / lessonsTotal * 100`.
/// * [lessonsCompleted] - Number of lessons the user has completed in this course.
/// * [lessonsTotal] - Total number of lessons in the course.
/// * [lastSeenAt] - Most recent moment any lesson in this course was watched (completed or not).
/// * [lastSeenLessonId] - The lesson the player last reported a position on, used to wire the 'Resume' CTA.
@BuiltValue()
abstract class ContinueWatchingItem implements Built<ContinueWatchingItem, ContinueWatchingItemBuilder> {
  /// Server-generated cuid identifying the course.
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Display title of the course.
  @BuiltValueField(wireName: r'courseTitle')
  String get courseTitle;

  /// Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet.
  @BuiltValueField(wireName: r'librarySlug')
  String? get librarySlug;

  /// Course completion = `lessonsCompleted / lessonsTotal * 100`.
  @BuiltValueField(wireName: r'percent')
  num get percent;

  /// Number of lessons the user has completed in this course.
  @BuiltValueField(wireName: r'lessonsCompleted')
  int get lessonsCompleted;

  /// Total number of lessons in the course.
  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  /// Most recent moment any lesson in this course was watched (completed or not).
  @BuiltValueField(wireName: r'lastSeenAt')
  DateTime get lastSeenAt;

  /// The lesson the player last reported a position on, used to wire the 'Resume' CTA.
  @BuiltValueField(wireName: r'lastSeenLessonId')
  String get lastSeenLessonId;

  ContinueWatchingItem._();

  factory ContinueWatchingItem([void updates(ContinueWatchingItemBuilder b)]) = _$ContinueWatchingItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ContinueWatchingItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ContinueWatchingItem> get serializer => _$ContinueWatchingItemSerializer();
}

class _$ContinueWatchingItemSerializer implements PrimitiveSerializer<ContinueWatchingItem> {
  @override
  final Iterable<Type> types = const [ContinueWatchingItem, _$ContinueWatchingItem];

  @override
  final String wireName = r'ContinueWatchingItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ContinueWatchingItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    if (object.librarySlug != null) {
      yield r'librarySlug';
      yield serializers.serialize(
        object.librarySlug,
        specifiedType: const FullType(String),
      );
    }
    yield r'percent';
    yield serializers.serialize(
      object.percent,
      specifiedType: const FullType(num),
    );
    yield r'lessonsCompleted';
    yield serializers.serialize(
      object.lessonsCompleted,
      specifiedType: const FullType(int),
    );
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
    yield r'lastSeenAt';
    yield serializers.serialize(
      object.lastSeenAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'lastSeenLessonId';
    yield serializers.serialize(
      object.lastSeenLessonId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ContinueWatchingItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ContinueWatchingItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'librarySlug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.librarySlug = valueDes;
          break;
        case r'percent':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.percent = valueDes;
          break;
        case r'lessonsCompleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsCompleted = valueDes;
          break;
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        case r'lastSeenAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.lastSeenAt = valueDes;
          break;
        case r'lastSeenLessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lastSeenLessonId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ContinueWatchingItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ContinueWatchingItemBuilder();
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


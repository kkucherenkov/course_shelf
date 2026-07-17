//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recently_added_item.g.dart';

/// A course freshly added to one of the requester's libraries.
///
/// Properties:
/// * [courseId] - Server-generated cuid identifying the course.
/// * [courseTitle] - Display title of the course.
/// * [librarySlug] - Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet.
/// * [lessonCount] - Number of lessons in the course at intake time.
/// * [totalDurationSeconds] - Sum of `Lesson.duration` across the course, in whole seconds.
/// * [createdAt] - Moment the course was added to its library.
@BuiltValue()
abstract class RecentlyAddedItem implements Built<RecentlyAddedItem, RecentlyAddedItemBuilder> {
  /// Server-generated cuid identifying the course.
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Display title of the course.
  @BuiltValueField(wireName: r'courseTitle')
  String get courseTitle;

  /// Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet.
  @BuiltValueField(wireName: r'librarySlug')
  String? get librarySlug;

  /// Number of lessons in the course at intake time.
  @BuiltValueField(wireName: r'lessonCount')
  int get lessonCount;

  /// Sum of `Lesson.duration` across the course, in whole seconds.
  @BuiltValueField(wireName: r'totalDurationSeconds')
  int get totalDurationSeconds;

  /// Moment the course was added to its library.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  RecentlyAddedItem._();

  factory RecentlyAddedItem([void updates(RecentlyAddedItemBuilder b)]) = _$RecentlyAddedItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentlyAddedItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentlyAddedItem> get serializer => _$RecentlyAddedItemSerializer();
}

class _$RecentlyAddedItemSerializer implements PrimitiveSerializer<RecentlyAddedItem> {
  @override
  final Iterable<Type> types = const [RecentlyAddedItem, _$RecentlyAddedItem];

  @override
  final String wireName = r'RecentlyAddedItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentlyAddedItem object, {
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
    yield r'lessonCount';
    yield serializers.serialize(
      object.lessonCount,
      specifiedType: const FullType(int),
    );
    yield r'totalDurationSeconds';
    yield serializers.serialize(
      object.totalDurationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentlyAddedItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentlyAddedItemBuilder result,
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
        case r'lessonCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonCount = valueDes;
          break;
        case r'totalDurationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalDurationSeconds = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecentlyAddedItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentlyAddedItemBuilder();
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


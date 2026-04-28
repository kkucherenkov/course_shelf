//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recently_completed_item.g.dart';

/// A course where the requester completed every lesson. Sourced from the `CourseProgressReadModel` projection (`lessonsCompleted == lessonsTotal`).
///
/// Properties:
/// * [courseId] - Server-generated cuid identifying the course.
/// * [courseTitle] - Display title of the course.
/// * [librarySlug] - Slug of the parent library, included for the URL builder.
/// * [lessonsTotal] - Total lessons in the course (== lessons completed for this row).
/// * [completedAt] - Time the requester finished the last lesson — `CourseProgressReadModel.lastSeenAt` at the moment percent hit 100.
@BuiltValue()
abstract class RecentlyCompletedItem implements Built<RecentlyCompletedItem, RecentlyCompletedItemBuilder> {
  /// Server-generated cuid identifying the course.
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Display title of the course.
  @BuiltValueField(wireName: r'courseTitle')
  String get courseTitle;

  /// Slug of the parent library, included for the URL builder.
  @BuiltValueField(wireName: r'librarySlug')
  String? get librarySlug;

  /// Total lessons in the course (== lessons completed for this row).
  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  /// Time the requester finished the last lesson — `CourseProgressReadModel.lastSeenAt` at the moment percent hit 100.
  @BuiltValueField(wireName: r'completedAt')
  DateTime get completedAt;

  RecentlyCompletedItem._();

  factory RecentlyCompletedItem([void updates(RecentlyCompletedItemBuilder b)]) = _$RecentlyCompletedItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentlyCompletedItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentlyCompletedItem> get serializer => _$RecentlyCompletedItemSerializer();
}

class _$RecentlyCompletedItemSerializer implements PrimitiveSerializer<RecentlyCompletedItem> {
  @override
  final Iterable<Type> types = const [RecentlyCompletedItem, _$RecentlyCompletedItem];

  @override
  final String wireName = r'RecentlyCompletedItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentlyCompletedItem object, {
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
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
    yield r'completedAt';
    yield serializers.serialize(
      object.completedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentlyCompletedItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentlyCompletedItemBuilder result,
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
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.completedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecentlyCompletedItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentlyCompletedItemBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lesson_outline_item.g.dart';

/// Lightweight per-lesson row for the Course detail outline. Maps 1:1 to the AppLessonRow component's props.
///
/// Properties:
/// * [id] 
/// * [position] 
/// * [title] 
/// * [durationSeconds] 
/// * [hasMaterials] - Whether the lesson has at least one sidecar material.
/// * [state] - Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
/// * [progressPercent] - 0..100 — only meaningful when `state === 'in-progress'`.
@BuiltValue()
abstract class LessonOutlineItem implements Built<LessonOutlineItem, LessonOutlineItemBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'position')
  int get position;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'durationSeconds')
  int get durationSeconds;

  /// Whether the lesson has at least one sidecar material.
  @BuiltValueField(wireName: r'hasMaterials')
  bool get hasMaterials;

  /// Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
  @BuiltValueField(wireName: r'state')
  LessonOutlineItemStateEnum get state;
  // enum stateEnum {  not-started,  in-progress,  completed,  locked,  };

  /// 0..100 — only meaningful when `state === 'in-progress'`.
  @BuiltValueField(wireName: r'progressPercent')
  int get progressPercent;

  LessonOutlineItem._();

  factory LessonOutlineItem([void updates(LessonOutlineItemBuilder b)]) = _$LessonOutlineItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LessonOutlineItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LessonOutlineItem> get serializer => _$LessonOutlineItemSerializer();
}

class _$LessonOutlineItemSerializer implements PrimitiveSerializer<LessonOutlineItem> {
  @override
  final Iterable<Type> types = const [LessonOutlineItem, _$LessonOutlineItem];

  @override
  final String wireName = r'LessonOutlineItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LessonOutlineItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(int),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'durationSeconds';
    yield serializers.serialize(
      object.durationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'hasMaterials';
    yield serializers.serialize(
      object.hasMaterials,
      specifiedType: const FullType(bool),
    );
    yield r'state';
    yield serializers.serialize(
      object.state,
      specifiedType: const FullType(LessonOutlineItemStateEnum),
    );
    yield r'progressPercent';
    yield serializers.serialize(
      object.progressPercent,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LessonOutlineItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LessonOutlineItemBuilder result,
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
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.position = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'durationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.durationSeconds = valueDes;
          break;
        case r'hasMaterials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasMaterials = valueDes;
          break;
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LessonOutlineItemStateEnum),
          ) as LessonOutlineItemStateEnum;
          result.state = valueDes;
          break;
        case r'progressPercent':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.progressPercent = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LessonOutlineItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LessonOutlineItemBuilder();
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

class LessonOutlineItemStateEnum extends EnumClass {

  /// Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
  @BuiltValueEnumConst(wireName: r'not-started')
  static const LessonOutlineItemStateEnum notStarted = _$lessonOutlineItemStateEnum_notStarted;
  /// Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
  @BuiltValueEnumConst(wireName: r'in-progress')
  static const LessonOutlineItemStateEnum inProgress = _$lessonOutlineItemStateEnum_inProgress;
  /// Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
  @BuiltValueEnumConst(wireName: r'completed')
  static const LessonOutlineItemStateEnum completed = _$lessonOutlineItemStateEnum_completed;
  /// Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
  @BuiltValueEnumConst(wireName: r'locked')
  static const LessonOutlineItemStateEnum locked = _$lessonOutlineItemStateEnum_locked;

  static Serializer<LessonOutlineItemStateEnum> get serializer => _$lessonOutlineItemStateEnumSerializer;

  const LessonOutlineItemStateEnum._(String name): super(name);

  static BuiltSet<LessonOutlineItemStateEnum> get values => _$lessonOutlineItemStateEnumValues;
  static LessonOutlineItemStateEnum valueOf(String name) => _$lessonOutlineItemStateEnumValueOf(name);
}


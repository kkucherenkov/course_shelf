//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'flashcard_dto.g.dart';

/// A single user-owned flashcard with its SM-2 review schedule.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this flashcard.
/// * [lessonId] - cuid of the lesson this flashcard belongs to.
/// * [front] - Prompt side. Trimmed server-side.
/// * [back] - Answer side. Trimmed server-side.
/// * [sourceCueId] - cuid of the TranscriptCue this card was made from, when created from a transcript line. Absent for manual and note-derived cards.
/// * [easeFactor] - SM-2 ease factor. Starts at 2.5, floors at 1.3.
/// * [intervalDays] - Days until the next scheduled review. 0 for a never-reviewed card.
/// * [repetitions] - Consecutive passing reviews (grade >= 3) since the last lapse.
/// * [dueAt] - ISO-8601 instant this card is next due for review.
/// * [createdAt] - ISO-8601 instant when the flashcard was first created.
/// * [updatedAt] - ISO-8601 instant when the flashcard was last updated.
@BuiltValue()
abstract class FlashcardDto implements Built<FlashcardDto, FlashcardDtoBuilder> {
  /// Server-generated cuid identifying this flashcard.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the lesson this flashcard belongs to.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Prompt side. Trimmed server-side.
  @BuiltValueField(wireName: r'front')
  String get front;

  /// Answer side. Trimmed server-side.
  @BuiltValueField(wireName: r'back')
  String get back;

  /// cuid of the TranscriptCue this card was made from, when created from a transcript line. Absent for manual and note-derived cards.
  @BuiltValueField(wireName: r'sourceCueId')
  String? get sourceCueId;

  /// SM-2 ease factor. Starts at 2.5, floors at 1.3.
  @BuiltValueField(wireName: r'easeFactor')
  double get easeFactor;

  /// Days until the next scheduled review. 0 for a never-reviewed card.
  @BuiltValueField(wireName: r'intervalDays')
  int get intervalDays;

  /// Consecutive passing reviews (grade >= 3) since the last lapse.
  @BuiltValueField(wireName: r'repetitions')
  int get repetitions;

  /// ISO-8601 instant this card is next due for review.
  @BuiltValueField(wireName: r'dueAt')
  DateTime get dueAt;

  /// ISO-8601 instant when the flashcard was first created.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// ISO-8601 instant when the flashcard was last updated.
  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  FlashcardDto._();

  factory FlashcardDto([void updates(FlashcardDtoBuilder b)]) = _$FlashcardDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FlashcardDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FlashcardDto> get serializer => _$FlashcardDtoSerializer();
}

class _$FlashcardDtoSerializer implements PrimitiveSerializer<FlashcardDto> {
  @override
  final Iterable<Type> types = const [FlashcardDto, _$FlashcardDto];

  @override
  final String wireName = r'FlashcardDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FlashcardDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'front';
    yield serializers.serialize(
      object.front,
      specifiedType: const FullType(String),
    );
    yield r'back';
    yield serializers.serialize(
      object.back,
      specifiedType: const FullType(String),
    );
    if (object.sourceCueId != null) {
      yield r'sourceCueId';
      yield serializers.serialize(
        object.sourceCueId,
        specifiedType: const FullType(String),
      );
    }
    yield r'easeFactor';
    yield serializers.serialize(
      object.easeFactor,
      specifiedType: const FullType(double),
    );
    yield r'intervalDays';
    yield serializers.serialize(
      object.intervalDays,
      specifiedType: const FullType(int),
    );
    yield r'repetitions';
    yield serializers.serialize(
      object.repetitions,
      specifiedType: const FullType(int),
    );
    yield r'dueAt';
    yield serializers.serialize(
      object.dueAt,
      specifiedType: const FullType(DateTime),
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
    FlashcardDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FlashcardDtoBuilder result,
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
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'front':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.front = valueDes;
          break;
        case r'back':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.back = valueDes;
          break;
        case r'sourceCueId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceCueId = valueDes;
          break;
        case r'easeFactor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.easeFactor = valueDes;
          break;
        case r'intervalDays':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.intervalDays = valueDes;
          break;
        case r'repetitions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.repetitions = valueDes;
          break;
        case r'dueAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.dueAt = valueDes;
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
  FlashcardDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FlashcardDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'grade_flashcard_request.g.dart';

/// SM-2 quality-of-response grade for one review of a flashcard.
///
/// Properties:
/// * [grade] - 0 - complete blackout    3 - correct, serious difficulty 1 - incorrect, familiar  4 - correct, some hesitation 2 - incorrect, easy      5 - perfect recall Grades below 3 are a lapse: the repetition streak resets and the card is due again in 1 day. 
@BuiltValue()
abstract class GradeFlashcardRequest implements Built<GradeFlashcardRequest, GradeFlashcardRequestBuilder> {
  /// 0 - complete blackout    3 - correct, serious difficulty 1 - incorrect, familiar  4 - correct, some hesitation 2 - incorrect, easy      5 - perfect recall Grades below 3 are a lapse: the repetition streak resets and the card is due again in 1 day. 
  @BuiltValueField(wireName: r'grade')
  int get grade;

  GradeFlashcardRequest._();

  factory GradeFlashcardRequest([void updates(GradeFlashcardRequestBuilder b)]) = _$GradeFlashcardRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GradeFlashcardRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GradeFlashcardRequest> get serializer => _$GradeFlashcardRequestSerializer();
}

class _$GradeFlashcardRequestSerializer implements PrimitiveSerializer<GradeFlashcardRequest> {
  @override
  final Iterable<Type> types = const [GradeFlashcardRequest, _$GradeFlashcardRequest];

  @override
  final String wireName = r'GradeFlashcardRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GradeFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'grade';
    yield serializers.serialize(
      object.grade,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GradeFlashcardRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required GradeFlashcardRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'grade':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.grade = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GradeFlashcardRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GradeFlashcardRequestBuilder();
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


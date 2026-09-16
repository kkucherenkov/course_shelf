//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/quiz_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'quiz_list_dto.g.dart';

/// Quizzes, newest first.
///
/// Properties:
/// * [quizzes] 
@BuiltValue()
abstract class QuizListDto implements Built<QuizListDto, QuizListDtoBuilder> {
  @BuiltValueField(wireName: r'quizzes')
  BuiltList<QuizDto> get quizzes;

  QuizListDto._();

  factory QuizListDto([void updates(QuizListDtoBuilder b)]) = _$QuizListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(QuizListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<QuizListDto> get serializer => _$QuizListDtoSerializer();
}

class _$QuizListDtoSerializer implements PrimitiveSerializer<QuizListDto> {
  @override
  final Iterable<Type> types = const [QuizListDto, _$QuizListDto];

  @override
  final String wireName = r'QuizListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    QuizListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'quizzes';
    yield serializers.serialize(
      object.quizzes,
      specifiedType: const FullType(BuiltList, [FullType(QuizDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    QuizListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required QuizListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'quizzes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(QuizDto)]),
          ) as BuiltList<QuizDto>;
          result.quizzes.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  QuizListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = QuizListDtoBuilder();
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


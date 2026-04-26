//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'note_dto.g.dart';

/// A user-owned Markdown note attached to a single lesson.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this note.
/// * [lessonId] - cuid of the lesson this note belongs to.
/// * [body] - Plain Markdown stored verbatim. Server does not render.
/// * [createdAt] - ISO-8601 instant when the note was first created.
/// * [updatedAt] - ISO-8601 instant when the note body was last replaced.
@BuiltValue()
abstract class NoteDto implements Built<NoteDto, NoteDtoBuilder> {
  /// Server-generated cuid identifying this note.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the lesson this note belongs to.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Plain Markdown stored verbatim. Server does not render.
  @BuiltValueField(wireName: r'body')
  String get body;

  /// ISO-8601 instant when the note was first created.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// ISO-8601 instant when the note body was last replaced.
  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  NoteDto._();

  factory NoteDto([void updates(NoteDtoBuilder b)]) = _$NoteDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(NoteDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NoteDto> get serializer => _$NoteDtoSerializer();
}

class _$NoteDtoSerializer implements PrimitiveSerializer<NoteDto> {
  @override
  final Iterable<Type> types = const [NoteDto, _$NoteDto];

  @override
  final String wireName = r'NoteDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NoteDto object, {
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
    yield r'body';
    yield serializers.serialize(
      object.body,
      specifiedType: const FullType(String),
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
    NoteDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required NoteDtoBuilder result,
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
        case r'body':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.body = valueDes;
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
  NoteDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NoteDtoBuilder();
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


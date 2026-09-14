//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'instructor_ref.g.dart';

/// Lightweight reference to an instructor, embedded in CourseDto.
///
/// Properties:
/// * [id] - Server-generated cuid of the instructor.
/// * [slug] - URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates. The shape is enforced by the server (the `Slug` value object), not by this schema: a `pattern` here would have to be a Unicode property expression, which the contract-test generator cannot build values for, and that made the gate fail at random depending on which operations a stateful scenario happened to chain. An invalid slug is answered 422 by the domain rather than 400 by the request validator.
/// * [displayName] 
@BuiltValue()
abstract class InstructorRef implements Built<InstructorRef, InstructorRefBuilder> {
  /// Server-generated cuid of the instructor.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates. The shape is enforced by the server (the `Slug` value object), not by this schema: a `pattern` here would have to be a Unicode property expression, which the contract-test generator cannot build values for, and that made the gate fail at random depending on which operations a stateful scenario happened to chain. An invalid slug is answered 422 by the domain rather than 400 by the request validator.
  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  InstructorRef._();

  factory InstructorRef([void updates(InstructorRefBuilder b)]) = _$InstructorRef;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstructorRefBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstructorRef> get serializer => _$InstructorRefSerializer();
}

class _$InstructorRefSerializer implements PrimitiveSerializer<InstructorRef> {
  @override
  final Iterable<Type> types = const [InstructorRef, _$InstructorRef];

  @override
  final String wireName = r'InstructorRef';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstructorRef object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'slug';
    yield serializers.serialize(
      object.slug,
      specifiedType: const FullType(String),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    InstructorRef object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstructorRefBuilder result,
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
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InstructorRef deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstructorRefBuilder();
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


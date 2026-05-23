//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'instructor_dto.g.dart';

/// Full representation of an Instructor aggregate.
///
/// Properties:
/// * [id] - Server-generated cuid.
/// * [slug] - URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Shared by Instructor, Studio, and Tag aggregates.
/// * [displayName] - Human-readable instructor name.
/// * [externalIds] - External system references for this instructor.
/// * [coursesTotal] - Total number of courses linked to this instructor.
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class InstructorDto implements Built<InstructorDto, InstructorDtoBuilder> {
  /// Server-generated cuid.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Shared by Instructor, Studio, and Tag aggregates.
  @BuiltValueField(wireName: r'slug')
  String get slug;

  /// Human-readable instructor name.
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  /// External system references for this instructor.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef> get externalIds;

  /// Total number of courses linked to this instructor.
  @BuiltValueField(wireName: r'coursesTotal')
  int get coursesTotal;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  InstructorDto._();

  factory InstructorDto([void updates(InstructorDtoBuilder b)]) = _$InstructorDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstructorDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstructorDto> get serializer => _$InstructorDtoSerializer();
}

class _$InstructorDtoSerializer implements PrimitiveSerializer<InstructorDto> {
  @override
  final Iterable<Type> types = const [InstructorDto, _$InstructorDto];

  @override
  final String wireName = r'InstructorDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstructorDto object, {
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
    yield r'externalIds';
    yield serializers.serialize(
      object.externalIds,
      specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
    );
    yield r'coursesTotal';
    yield serializers.serialize(
      object.coursesTotal,
      specifiedType: const FullType(int),
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
    InstructorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstructorDtoBuilder result,
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
        case r'externalIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
          ) as BuiltList<ExternalIdRef>;
          result.externalIds.replace(valueDes);
          break;
        case r'coursesTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.coursesTotal = valueDes;
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
  InstructorDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstructorDtoBuilder();
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


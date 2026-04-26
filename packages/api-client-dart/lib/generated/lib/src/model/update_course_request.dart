//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_course_request.g.dart';

/// Payload for updating course metadata. All fields are optional, but at least one of `title`, `description`, or `slug` must be present (server-side validation rule — OpenAPI does not have a native \"at-least-one\" constraint). 
///
/// Properties:
/// * [title] 
/// * [description] 
/// * [slug] - URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
@BuiltValue()
abstract class UpdateCourseRequest implements Built<UpdateCourseRequest, UpdateCourseRequestBuilder> {
  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  /// URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
  @BuiltValueField(wireName: r'slug')
  String? get slug;

  UpdateCourseRequest._();

  factory UpdateCourseRequest([void updates(UpdateCourseRequestBuilder b)]) = _$UpdateCourseRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateCourseRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateCourseRequest> get serializer => _$UpdateCourseRequestSerializer();
}

class _$UpdateCourseRequestSerializer implements PrimitiveSerializer<UpdateCourseRequest> {
  @override
  final Iterable<Type> types = const [UpdateCourseRequest, _$UpdateCourseRequest];

  @override
  final String wireName = r'UpdateCourseRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateCourseRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.slug != null) {
      yield r'slug';
      yield serializers.serialize(
        object.slug,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateCourseRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateCourseRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateCourseRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateCourseRequestBuilder();
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


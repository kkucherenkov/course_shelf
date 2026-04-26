//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'section_dto.g.dart';

/// A section within a course.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this section.
/// * [position] - 1-based position within the course. Sections are returned sorted by position.
/// * [title] 
@BuiltValue()
abstract class SectionDto implements Built<SectionDto, SectionDtoBuilder> {
  /// Server-generated cuid identifying this section.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// 1-based position within the course. Sections are returned sorted by position.
  @BuiltValueField(wireName: r'position')
  int get position;

  @BuiltValueField(wireName: r'title')
  String get title;

  SectionDto._();

  factory SectionDto([void updates(SectionDtoBuilder b)]) = _$SectionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SectionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SectionDto> get serializer => _$SectionDtoSerializer();
}

class _$SectionDtoSerializer implements PrimitiveSerializer<SectionDto> {
  @override
  final Iterable<Type> types = const [SectionDto, _$SectionDto];

  @override
  final String wireName = r'SectionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SectionDto object, {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    SectionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SectionDtoBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SectionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SectionDtoBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'subtitle_dto.g.dart';

/// A subtitle track available for a lesson.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this subtitle track.
/// * [language] - BCP-47-ish language code parsed from the filename suffix (`Lesson.en.srt` → `en`). `und` when no suffix is present.
/// * [label] - Human-readable label for the subtitle track (e.g. \"English\").
@BuiltValue()
abstract class SubtitleDto implements Built<SubtitleDto, SubtitleDtoBuilder> {
  /// Server-generated cuid identifying this subtitle track.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// BCP-47-ish language code parsed from the filename suffix (`Lesson.en.srt` → `en`). `und` when no suffix is present.
  @BuiltValueField(wireName: r'language')
  String get language;

  /// Human-readable label for the subtitle track (e.g. \"English\").
  @BuiltValueField(wireName: r'label')
  String get label;

  SubtitleDto._();

  factory SubtitleDto([void updates(SubtitleDtoBuilder b)]) = _$SubtitleDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SubtitleDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SubtitleDto> get serializer => _$SubtitleDtoSerializer();
}

class _$SubtitleDtoSerializer implements PrimitiveSerializer<SubtitleDto> {
  @override
  final Iterable<Type> types = const [SubtitleDto, _$SubtitleDto];

  @override
  final String wireName = r'SubtitleDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SubtitleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'language';
    yield serializers.serialize(
      object.language,
      specifiedType: const FullType(String),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SubtitleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SubtitleDtoBuilder result,
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
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.language = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SubtitleDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SubtitleDtoBuilder();
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


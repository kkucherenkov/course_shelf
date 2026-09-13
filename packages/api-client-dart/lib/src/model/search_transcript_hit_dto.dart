//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_transcript_hit_dto.g.dart';

/// SearchTranscriptHitDto
///
/// Properties:
/// * [lessonId] 
/// * [lessonTitle] - Title of the lesson the cue belongs to.
/// * [courseId] 
/// * [courseTitle] - Title of the parent course — included so the SPA can show breadcrumb context.
/// * [sectionTitle] - Title of the parent section.
/// * [language] - BCP-47-ish language tag of the transcript the cue belongs to.
/// * [startMs] - Cue start time in milliseconds, for seeking straight to the moment.
/// * [text] - The cue text that matched the query.
@BuiltValue()
abstract class SearchTranscriptHitDto implements Built<SearchTranscriptHitDto, SearchTranscriptHitDtoBuilder> {
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Title of the lesson the cue belongs to.
  @BuiltValueField(wireName: r'lessonTitle')
  String get lessonTitle;

  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Title of the parent course — included so the SPA can show breadcrumb context.
  @BuiltValueField(wireName: r'courseTitle')
  String get courseTitle;

  /// Title of the parent section.
  @BuiltValueField(wireName: r'sectionTitle')
  String get sectionTitle;

  /// BCP-47-ish language tag of the transcript the cue belongs to.
  @BuiltValueField(wireName: r'language')
  String get language;

  /// Cue start time in milliseconds, for seeking straight to the moment.
  @BuiltValueField(wireName: r'startMs')
  int get startMs;

  /// The cue text that matched the query.
  @BuiltValueField(wireName: r'text')
  String get text;

  SearchTranscriptHitDto._();

  factory SearchTranscriptHitDto([void updates(SearchTranscriptHitDtoBuilder b)]) = _$SearchTranscriptHitDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchTranscriptHitDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchTranscriptHitDto> get serializer => _$SearchTranscriptHitDtoSerializer();
}

class _$SearchTranscriptHitDtoSerializer implements PrimitiveSerializer<SearchTranscriptHitDto> {
  @override
  final Iterable<Type> types = const [SearchTranscriptHitDto, _$SearchTranscriptHitDto];

  @override
  final String wireName = r'SearchTranscriptHitDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchTranscriptHitDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'lessonTitle';
    yield serializers.serialize(
      object.lessonTitle,
      specifiedType: const FullType(String),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'courseTitle';
    yield serializers.serialize(
      object.courseTitle,
      specifiedType: const FullType(String),
    );
    yield r'sectionTitle';
    yield serializers.serialize(
      object.sectionTitle,
      specifiedType: const FullType(String),
    );
    yield r'language';
    yield serializers.serialize(
      object.language,
      specifiedType: const FullType(String),
    );
    yield r'startMs';
    yield serializers.serialize(
      object.startMs,
      specifiedType: const FullType(int),
    );
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchTranscriptHitDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchTranscriptHitDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'lessonTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonTitle = valueDes;
          break;
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'courseTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseTitle = valueDes;
          break;
        case r'sectionTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sectionTitle = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.language = valueDes;
          break;
        case r'startMs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.startMs = valueDes;
          break;
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchTranscriptHitDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchTranscriptHitDtoBuilder();
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


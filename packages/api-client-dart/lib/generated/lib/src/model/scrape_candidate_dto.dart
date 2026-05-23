//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scraped_course_fragment_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scrape_candidate_dto.g.dart';

/// A single candidate produced by a scraper run.
///
/// Properties:
/// * [source_] - Id of the scraper that produced this candidate (e.g. `youtube`, `json-ld`).
/// * [sourceUrl] - URL of the upstream resource that was fetched, if applicable.
/// * [confidence] - Optional confidence score in the range [0, 1].
/// * [fragment] 
@BuiltValue()
abstract class ScrapeCandidateDto implements Built<ScrapeCandidateDto, ScrapeCandidateDtoBuilder> {
  /// Id of the scraper that produced this candidate (e.g. `youtube`, `json-ld`).
  @BuiltValueField(wireName: r'source')
  String get source_;

  /// URL of the upstream resource that was fetched, if applicable.
  @BuiltValueField(wireName: r'sourceUrl')
  String? get sourceUrl;

  /// Optional confidence score in the range [0, 1].
  @BuiltValueField(wireName: r'confidence')
  double? get confidence;

  @BuiltValueField(wireName: r'fragment')
  ScrapedCourseFragmentDto get fragment;

  ScrapeCandidateDto._();

  factory ScrapeCandidateDto([void updates(ScrapeCandidateDtoBuilder b)]) = _$ScrapeCandidateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScrapeCandidateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScrapeCandidateDto> get serializer => _$ScrapeCandidateDtoSerializer();
}

class _$ScrapeCandidateDtoSerializer implements PrimitiveSerializer<ScrapeCandidateDto> {
  @override
  final Iterable<Type> types = const [ScrapeCandidateDto, _$ScrapeCandidateDto];

  @override
  final String wireName = r'ScrapeCandidateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScrapeCandidateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(String),
    );
    if (object.sourceUrl != null) {
      yield r'sourceUrl';
      yield serializers.serialize(
        object.sourceUrl,
        specifiedType: const FullType(String),
      );
    }
    if (object.confidence != null) {
      yield r'confidence';
      yield serializers.serialize(
        object.confidence,
        specifiedType: const FullType(double),
      );
    }
    yield r'fragment';
    yield serializers.serialize(
      object.fragment,
      specifiedType: const FullType(ScrapedCourseFragmentDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ScrapeCandidateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScrapeCandidateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.source_ = valueDes;
          break;
        case r'sourceUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceUrl = valueDes;
          break;
        case r'confidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.confidence = valueDes;
          break;
        case r'fragment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScrapedCourseFragmentDto),
          ) as ScrapedCourseFragmentDto;
          result.fragment.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScrapeCandidateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScrapeCandidateDtoBuilder();
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


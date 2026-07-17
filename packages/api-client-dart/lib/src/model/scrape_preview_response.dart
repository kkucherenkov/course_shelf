//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/scrape_candidate_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scrape_preview_response.g.dart';

/// Zero or more scrape candidates returned by the preview endpoint.
///
/// Properties:
/// * [candidates] - Ordered list of scrape candidates; may be empty.
@BuiltValue()
abstract class ScrapePreviewResponse implements Built<ScrapePreviewResponse, ScrapePreviewResponseBuilder> {
  /// Ordered list of scrape candidates; may be empty.
  @BuiltValueField(wireName: r'candidates')
  BuiltList<ScrapeCandidateDto> get candidates;

  ScrapePreviewResponse._();

  factory ScrapePreviewResponse([void updates(ScrapePreviewResponseBuilder b)]) = _$ScrapePreviewResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScrapePreviewResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScrapePreviewResponse> get serializer => _$ScrapePreviewResponseSerializer();
}

class _$ScrapePreviewResponseSerializer implements PrimitiveSerializer<ScrapePreviewResponse> {
  @override
  final Iterable<Type> types = const [ScrapePreviewResponse, _$ScrapePreviewResponse];

  @override
  final String wireName = r'ScrapePreviewResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScrapePreviewResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'candidates';
    yield serializers.serialize(
      object.candidates,
      specifiedType: const FullType(BuiltList, [FullType(ScrapeCandidateDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ScrapePreviewResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScrapePreviewResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'candidates':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ScrapeCandidateDto)]),
          ) as BuiltList<ScrapeCandidateDto>;
          result.candidates.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScrapePreviewResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScrapePreviewResponseBuilder();
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


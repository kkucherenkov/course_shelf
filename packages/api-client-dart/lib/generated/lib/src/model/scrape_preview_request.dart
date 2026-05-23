//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scraper_kind.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scrape_preview_request.g.dart';

/// Input for the scrape-preview endpoint. The `kind` field determines which additional fields are required: `url` for kind=url, `query` for kind=name, `fragment` for kind=fragment. `source` pins the scraper explicitly; when omitted the registry auto-detects from the URL (kind=url) or falls back to `json-ld` (kind=fragment). Required for kind=name.
///
/// Properties:
/// * [source_] - Explicit scraper id (e.g. `youtube`, `udemy`, `json-ld`). Omit to auto-detect (kind=url) or default to json-ld (kind=fragment). Required for kind=name.
/// * [kind] 
/// * [url] - Required when kind=url.
/// * [query] - Required when kind=name.
/// * [fragment] - Required when kind=fragment (raw HTML or JSON-LD string).
@BuiltValue()
abstract class ScrapePreviewRequest implements Built<ScrapePreviewRequest, ScrapePreviewRequestBuilder> {
  /// Explicit scraper id (e.g. `youtube`, `udemy`, `json-ld`). Omit to auto-detect (kind=url) or default to json-ld (kind=fragment). Required for kind=name.
  @BuiltValueField(wireName: r'source')
  String? get source_;

  @BuiltValueField(wireName: r'kind')
  ScraperKind get kind;
  // enum kindEnum {  url,  name,  fragment,  };

  /// Required when kind=url.
  @BuiltValueField(wireName: r'url')
  String? get url;

  /// Required when kind=name.
  @BuiltValueField(wireName: r'query')
  String? get query;

  /// Required when kind=fragment (raw HTML or JSON-LD string).
  @BuiltValueField(wireName: r'fragment')
  String? get fragment;

  ScrapePreviewRequest._();

  factory ScrapePreviewRequest([void updates(ScrapePreviewRequestBuilder b)]) = _$ScrapePreviewRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScrapePreviewRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScrapePreviewRequest> get serializer => _$ScrapePreviewRequestSerializer();
}

class _$ScrapePreviewRequestSerializer implements PrimitiveSerializer<ScrapePreviewRequest> {
  @override
  final Iterable<Type> types = const [ScrapePreviewRequest, _$ScrapePreviewRequest];

  @override
  final String wireName = r'ScrapePreviewRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScrapePreviewRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.source_ != null) {
      yield r'source';
      yield serializers.serialize(
        object.source_,
        specifiedType: const FullType(String),
      );
    }
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(ScraperKind),
    );
    if (object.url != null) {
      yield r'url';
      yield serializers.serialize(
        object.url,
        specifiedType: const FullType(String),
      );
    }
    if (object.query != null) {
      yield r'query';
      yield serializers.serialize(
        object.query,
        specifiedType: const FullType(String),
      );
    }
    if (object.fragment != null) {
      yield r'fragment';
      yield serializers.serialize(
        object.fragment,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ScrapePreviewRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScrapePreviewRequestBuilder result,
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
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScraperKind),
          ) as ScraperKind;
          result.kind = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        case r'query':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.query = valueDes;
          break;
        case r'fragment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fragment = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScrapePreviewRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScrapePreviewRequestBuilder();
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


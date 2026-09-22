//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/scraper_kind.dart';
import 'package:app_api_client/src/model/scraper_origin.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scraper_info_dto.g.dart';

/// Metadata about a single registered scraper. Listed even when rejected at load time — see `loadError`. `origin` and `loadError` are absent on a response from a handler that predates this widening; a caller reading either treats a missing key the same as `null`.
///
/// Properties:
/// * [id] - Stable scraper identifier used as the `source` field in requests. For a definition file rejected before it could be parsed, this is the file's stem (`acme-academy.json` -> `acme-academy`) rather than an id declared inside it — a failed parse never produces one.
/// * [supportedKinds] - Invocation kinds this scraper handles. Empty for a rejected definition file: the kinds live inside the definition, and a failed parse never produces one to read them from.
/// * [configured] - True when the scraper loaded and holds all required credentials / config (e.g. YouTube requires an API key). False when configuration is missing, or when `loadError` is set.
/// * [origin] 
/// * [loadError] - Why this scraper was rejected at load time, e.g. a definition file that failed schema validation. Null for a scraper that loaded successfully.
@BuiltValue()
abstract class ScraperInfoDto implements Built<ScraperInfoDto, ScraperInfoDtoBuilder> {
  /// Stable scraper identifier used as the `source` field in requests. For a definition file rejected before it could be parsed, this is the file's stem (`acme-academy.json` -> `acme-academy`) rather than an id declared inside it — a failed parse never produces one.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Invocation kinds this scraper handles. Empty for a rejected definition file: the kinds live inside the definition, and a failed parse never produces one to read them from.
  @BuiltValueField(wireName: r'supportedKinds')
  BuiltList<ScraperKind> get supportedKinds;

  /// True when the scraper loaded and holds all required credentials / config (e.g. YouTube requires an API key). False when configuration is missing, or when `loadError` is set.
  @BuiltValueField(wireName: r'configured')
  bool get configured;

  @BuiltValueField(wireName: r'origin')
  ScraperOrigin? get origin;
  // enum originEnum {  built-in,  definition-file,  };

  /// Why this scraper was rejected at load time, e.g. a definition file that failed schema validation. Null for a scraper that loaded successfully.
  @BuiltValueField(wireName: r'loadError')
  String? get loadError;

  ScraperInfoDto._();

  factory ScraperInfoDto([void updates(ScraperInfoDtoBuilder b)]) = _$ScraperInfoDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScraperInfoDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScraperInfoDto> get serializer => _$ScraperInfoDtoSerializer();
}

class _$ScraperInfoDtoSerializer implements PrimitiveSerializer<ScraperInfoDto> {
  @override
  final Iterable<Type> types = const [ScraperInfoDto, _$ScraperInfoDto];

  @override
  final String wireName = r'ScraperInfoDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScraperInfoDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'supportedKinds';
    yield serializers.serialize(
      object.supportedKinds,
      specifiedType: const FullType(BuiltList, [FullType(ScraperKind)]),
    );
    yield r'configured';
    yield serializers.serialize(
      object.configured,
      specifiedType: const FullType(bool),
    );
    if (object.origin != null) {
      yield r'origin';
      yield serializers.serialize(
        object.origin,
        specifiedType: const FullType(ScraperOrigin),
      );
    }
    if (object.loadError != null) {
      yield r'loadError';
      yield serializers.serialize(
        object.loadError,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ScraperInfoDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScraperInfoDtoBuilder result,
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
        case r'supportedKinds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ScraperKind)]),
          ) as BuiltList<ScraperKind>;
          result.supportedKinds.replace(valueDes);
          break;
        case r'configured':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.configured = valueDes;
          break;
        case r'origin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScraperOrigin),
          ) as ScraperOrigin;
          result.origin = valueDes;
          break;
        case r'loadError':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.loadError = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScraperInfoDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScraperInfoDtoBuilder();
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


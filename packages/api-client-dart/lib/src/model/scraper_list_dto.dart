//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/scraper_info_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scraper_list_dto.g.dart';

/// List of scrapers configured on this instance.
///
/// Properties:
/// * [scrapers] - All configured scrapers in registration order.
@BuiltValue()
abstract class ScraperListDto implements Built<ScraperListDto, ScraperListDtoBuilder> {
  /// All configured scrapers in registration order.
  @BuiltValueField(wireName: r'scrapers')
  BuiltList<ScraperInfoDto> get scrapers;

  ScraperListDto._();

  factory ScraperListDto([void updates(ScraperListDtoBuilder b)]) = _$ScraperListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScraperListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScraperListDto> get serializer => _$ScraperListDtoSerializer();
}

class _$ScraperListDtoSerializer implements PrimitiveSerializer<ScraperListDto> {
  @override
  final Iterable<Type> types = const [ScraperListDto, _$ScraperListDto];

  @override
  final String wireName = r'ScraperListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScraperListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'scrapers';
    yield serializers.serialize(
      object.scrapers,
      specifiedType: const FullType(BuiltList, [FullType(ScraperInfoDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ScraperListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScraperListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'scrapers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ScraperInfoDto)]),
          ) as BuiltList<ScraperInfoDto>;
          result.scrapers.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScraperListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScraperListDtoBuilder();
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


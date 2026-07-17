//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scraped_course_fragment_dto.dart';
import 'package:app_api_client/src/model/merge_policy_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'run_identify_request.g.dart';

/// Create an identify proposal from a chosen scrape candidate. The fragment is typically one of the candidates returned by scrape-preview.
///
/// Properties:
/// * [fragment] 
/// * [source_] - Label of the source/scraper this fragment came from.
/// * [sourceUrl] 
/// * [mergePolicy] - Optional initial policy. Defaults to `merge` for every field.
@BuiltValue()
abstract class RunIdentifyRequest implements Built<RunIdentifyRequest, RunIdentifyRequestBuilder> {
  @BuiltValueField(wireName: r'fragment')
  ScrapedCourseFragmentDto get fragment;

  /// Label of the source/scraper this fragment came from.
  @BuiltValueField(wireName: r'source')
  String get source_;

  @BuiltValueField(wireName: r'sourceUrl')
  String? get sourceUrl;

  /// Optional initial policy. Defaults to `merge` for every field.
  @BuiltValueField(wireName: r'mergePolicy')
  MergePolicyDto? get mergePolicy;

  RunIdentifyRequest._();

  factory RunIdentifyRequest([void updates(RunIdentifyRequestBuilder b)]) = _$RunIdentifyRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RunIdentifyRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RunIdentifyRequest> get serializer => _$RunIdentifyRequestSerializer();
}

class _$RunIdentifyRequestSerializer implements PrimitiveSerializer<RunIdentifyRequest> {
  @override
  final Iterable<Type> types = const [RunIdentifyRequest, _$RunIdentifyRequest];

  @override
  final String wireName = r'RunIdentifyRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RunIdentifyRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fragment';
    yield serializers.serialize(
      object.fragment,
      specifiedType: const FullType(ScrapedCourseFragmentDto),
    );
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
    if (object.mergePolicy != null) {
      yield r'mergePolicy';
      yield serializers.serialize(
        object.mergePolicy,
        specifiedType: const FullType(MergePolicyDto),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    RunIdentifyRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RunIdentifyRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fragment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScrapedCourseFragmentDto),
          ) as ScrapedCourseFragmentDto;
          result.fragment.replace(valueDes);
          break;
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
        case r'mergePolicy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergePolicyDto),
          ) as MergePolicyDto;
          result.mergePolicy.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RunIdentifyRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RunIdentifyRequestBuilder();
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


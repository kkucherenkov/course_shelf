//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/scraped_course_fragment_dto.dart';
import 'package:app_api_client/src/model/merge_policy_dto.dart';
import 'package:app_api_client/src/model/identify_task_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'identify_task_dto.g.dart';

/// An admin-reviewed metadata enrichment proposal for a course.
///
/// Properties:
/// * [id] 
/// * [courseId] 
/// * [status] 
/// * [source_] - Label of the scraper/source that produced the fragment.
/// * [sourceUrl] - URL the fragment was scraped from, if any.
/// * [scrapedFragment] 
/// * [mergePolicy] 
/// * [createdAt] 
/// * [completedAt] 
@BuiltValue()
abstract class IdentifyTaskDto implements Built<IdentifyTaskDto, IdentifyTaskDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  @BuiltValueField(wireName: r'status')
  IdentifyTaskStatus get status;
  // enum statusEnum {  proposed,  applied,  discarded,  };

  /// Label of the scraper/source that produced the fragment.
  @BuiltValueField(wireName: r'source')
  String get source_;

  /// URL the fragment was scraped from, if any.
  @BuiltValueField(wireName: r'sourceUrl')
  String? get sourceUrl;

  @BuiltValueField(wireName: r'scrapedFragment')
  ScrapedCourseFragmentDto get scrapedFragment;

  @BuiltValueField(wireName: r'mergePolicy')
  MergePolicyDto get mergePolicy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'completedAt')
  DateTime? get completedAt;

  IdentifyTaskDto._();

  factory IdentifyTaskDto([void updates(IdentifyTaskDtoBuilder b)]) = _$IdentifyTaskDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(IdentifyTaskDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<IdentifyTaskDto> get serializer => _$IdentifyTaskDtoSerializer();
}

class _$IdentifyTaskDtoSerializer implements PrimitiveSerializer<IdentifyTaskDto> {
  @override
  final Iterable<Type> types = const [IdentifyTaskDto, _$IdentifyTaskDto];

  @override
  final String wireName = r'IdentifyTaskDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    IdentifyTaskDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(IdentifyTaskStatus),
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
    yield r'scrapedFragment';
    yield serializers.serialize(
      object.scrapedFragment,
      specifiedType: const FullType(ScrapedCourseFragmentDto),
    );
    yield r'mergePolicy';
    yield serializers.serialize(
      object.mergePolicy,
      specifiedType: const FullType(MergePolicyDto),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.completedAt != null) {
      yield r'completedAt';
      yield serializers.serialize(
        object.completedAt,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    IdentifyTaskDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required IdentifyTaskDtoBuilder result,
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
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(IdentifyTaskStatus),
          ) as IdentifyTaskStatus;
          result.status = valueDes;
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
        case r'scrapedFragment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ScrapedCourseFragmentDto),
          ) as ScrapedCourseFragmentDto;
          result.scrapedFragment.replace(valueDes);
          break;
        case r'mergePolicy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergePolicyDto),
          ) as MergePolicyDto;
          result.mergePolicy.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.completedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  IdentifyTaskDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = IdentifyTaskDtoBuilder();
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


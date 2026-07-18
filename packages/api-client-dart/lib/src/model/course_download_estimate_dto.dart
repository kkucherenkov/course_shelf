//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_download_estimate_dto.g.dart';

/// Aggregate download size for a course — the sum of Lesson.sizeBytes across the lessons the requester can access. Feeds the mobile course-detail \"Download course · <size>\" CTA. Per-lesson download state is client-side; this reports only the byte total and the number of lessons it spans.
///
/// Properties:
/// * [courseId] - Server-generated cuid of the course this estimate is for.
/// * [totalBytes] - Sum of Lesson.sizeBytes (bytes) across all accessible lessons in the course.
/// * [lessonCount] - Number of lessons included in the byte sum.
@BuiltValue()
abstract class CourseDownloadEstimateDto implements Built<CourseDownloadEstimateDto, CourseDownloadEstimateDtoBuilder> {
  /// Server-generated cuid of the course this estimate is for.
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Sum of Lesson.sizeBytes (bytes) across all accessible lessons in the course.
  @BuiltValueField(wireName: r'totalBytes')
  int get totalBytes;

  /// Number of lessons included in the byte sum.
  @BuiltValueField(wireName: r'lessonCount')
  int get lessonCount;

  CourseDownloadEstimateDto._();

  factory CourseDownloadEstimateDto([void updates(CourseDownloadEstimateDtoBuilder b)]) = _$CourseDownloadEstimateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CourseDownloadEstimateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CourseDownloadEstimateDto> get serializer => _$CourseDownloadEstimateDtoSerializer();
}

class _$CourseDownloadEstimateDtoSerializer implements PrimitiveSerializer<CourseDownloadEstimateDto> {
  @override
  final Iterable<Type> types = const [CourseDownloadEstimateDto, _$CourseDownloadEstimateDto];

  @override
  final String wireName = r'CourseDownloadEstimateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CourseDownloadEstimateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'totalBytes';
    yield serializers.serialize(
      object.totalBytes,
      specifiedType: const FullType(int),
    );
    yield r'lessonCount';
    yield serializers.serialize(
      object.lessonCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CourseDownloadEstimateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CourseDownloadEstimateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'totalBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalBytes = valueDes;
          break;
        case r'lessonCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CourseDownloadEstimateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CourseDownloadEstimateDtoBuilder();
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


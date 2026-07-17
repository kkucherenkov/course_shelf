//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/lesson_progress.dart';
import 'package:app_api_client/src/model/material_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/subtitle_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lesson_dto.g.dart';

/// Full representation of a Lesson aggregate, including sidecar materials and subtitle tracks.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this lesson.
/// * [courseId] - cuid of the course this lesson belongs to.
/// * [sectionId] - cuid of the section this lesson belongs to.
/// * [position] - 1-based position within the section.
/// * [title] 
/// * [durationSeconds] - Video duration in seconds. Populated by E06-F02-S02 (ffprobe). `undefined` until then.
/// * [materials] - Sidecar materials (PDF / Markdown / text / image). Empty array when none.
/// * [subtitles] - Available subtitle tracks. Empty array when none.
/// * [progress] 
@BuiltValue()
abstract class LessonDto implements Built<LessonDto, LessonDtoBuilder> {
  /// Server-generated cuid identifying this lesson.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the course this lesson belongs to.
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// cuid of the section this lesson belongs to.
  @BuiltValueField(wireName: r'sectionId')
  String get sectionId;

  /// 1-based position within the section.
  @BuiltValueField(wireName: r'position')
  int get position;

  @BuiltValueField(wireName: r'title')
  String get title;

  /// Video duration in seconds. Populated by E06-F02-S02 (ffprobe). `undefined` until then.
  @BuiltValueField(wireName: r'durationSeconds')
  int? get durationSeconds;

  /// Sidecar materials (PDF / Markdown / text / image). Empty array when none.
  @BuiltValueField(wireName: r'materials')
  BuiltList<MaterialDto> get materials;

  /// Available subtitle tracks. Empty array when none.
  @BuiltValueField(wireName: r'subtitles')
  BuiltList<SubtitleDto> get subtitles;

  @BuiltValueField(wireName: r'progress')
  LessonProgress get progress;

  LessonDto._();

  factory LessonDto([void updates(LessonDtoBuilder b)]) = _$LessonDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LessonDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LessonDto> get serializer => _$LessonDtoSerializer();
}

class _$LessonDtoSerializer implements PrimitiveSerializer<LessonDto> {
  @override
  final Iterable<Type> types = const [LessonDto, _$LessonDto];

  @override
  final String wireName = r'LessonDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LessonDto object, {
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
    yield r'sectionId';
    yield serializers.serialize(
      object.sectionId,
      specifiedType: const FullType(String),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(int),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.durationSeconds != null) {
      yield r'durationSeconds';
      yield serializers.serialize(
        object.durationSeconds,
        specifiedType: const FullType(int),
      );
    }
    yield r'materials';
    yield serializers.serialize(
      object.materials,
      specifiedType: const FullType(BuiltList, [FullType(MaterialDto)]),
    );
    yield r'subtitles';
    yield serializers.serialize(
      object.subtitles,
      specifiedType: const FullType(BuiltList, [FullType(SubtitleDto)]),
    );
    yield r'progress';
    yield serializers.serialize(
      object.progress,
      specifiedType: const FullType(LessonProgress),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LessonDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LessonDtoBuilder result,
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
        case r'sectionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sectionId = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.position = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'durationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.durationSeconds = valueDes;
          break;
        case r'materials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(MaterialDto)]),
          ) as BuiltList<MaterialDto>;
          result.materials.replace(valueDes);
          break;
        case r'subtitles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SubtitleDto)]),
          ) as BuiltList<SubtitleDto>;
          result.subtitles.replace(valueDes);
          break;
        case r'progress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LessonProgress),
          ) as LessonProgress;
          result.progress.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LessonDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LessonDtoBuilder();
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


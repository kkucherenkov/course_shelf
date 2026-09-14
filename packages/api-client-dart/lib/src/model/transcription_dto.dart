//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/transcription_status.dart';
import 'package:app_api_client/src/model/transcription_error_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcription_dto.g.dart';

/// One pass over a library's videos. Lessons that already have a subtitle track, or an up-to-date generated transcript, are skipped — which is why a re-run is cheap and a restart costs at most one lesson.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this transcription run.
/// * [libraryId] - cuid of the library that was transcribed.
/// * [status] 
/// * [force] - When true, existing generated transcripts were redone.
/// * [startedAt] - ISO-8601 instant when the run was started.
/// * [finishedAt] - Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
/// * [lessonsTotal] - Lessons considered by this run.
/// * [lessonsSkipped] - Lessons left alone — a hand-made subtitle sidecar exists, or the generated transcript still matches the video's `(mtime, size)`.
/// * [lessonsTranscribed] - Lessons for which a transcript was produced by this run.
/// * [lessonsFailed] - Lessons that raised an error; one entry each in `errors`.
/// * [errors] - Non-fatal per-lesson errors encountered during the run.
/// * [scopeCourseId] - cuid of the course this run was scoped to. Absent for a library-wide run (`POST /libraries/{id}/transcriptions`) — present only for `POST /courses/{id}/transcription`.
/// * [scopeCourseName] - Title of the scoped course, so the UI can render \"transcribing <course>\" without a second round-trip. Absent for a library-wide run.
@BuiltValue()
abstract class TranscriptionDto implements Built<TranscriptionDto, TranscriptionDtoBuilder> {
  /// Server-generated cuid identifying this transcription run.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the library that was transcribed.
  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  @BuiltValueField(wireName: r'status')
  TranscriptionStatus get status;
  // enum statusEnum {  running,  succeeded,  failed,  cancelled,  interrupted,  };

  /// When true, existing generated transcripts were redone.
  @BuiltValueField(wireName: r'force')
  bool get force;

  /// ISO-8601 instant when the run was started.
  @BuiltValueField(wireName: r'startedAt')
  DateTime get startedAt;

  /// Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
  @BuiltValueField(wireName: r'finishedAt')
  DateTime? get finishedAt;

  /// Lessons considered by this run.
  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  /// Lessons left alone — a hand-made subtitle sidecar exists, or the generated transcript still matches the video's `(mtime, size)`.
  @BuiltValueField(wireName: r'lessonsSkipped')
  int get lessonsSkipped;

  /// Lessons for which a transcript was produced by this run.
  @BuiltValueField(wireName: r'lessonsTranscribed')
  int get lessonsTranscribed;

  /// Lessons that raised an error; one entry each in `errors`.
  @BuiltValueField(wireName: r'lessonsFailed')
  int get lessonsFailed;

  /// Non-fatal per-lesson errors encountered during the run.
  @BuiltValueField(wireName: r'errors')
  BuiltList<TranscriptionErrorDto> get errors;

  /// cuid of the course this run was scoped to. Absent for a library-wide run (`POST /libraries/{id}/transcriptions`) — present only for `POST /courses/{id}/transcription`.
  @BuiltValueField(wireName: r'scopeCourseId')
  String? get scopeCourseId;

  /// Title of the scoped course, so the UI can render \"transcribing <course>\" without a second round-trip. Absent for a library-wide run.
  @BuiltValueField(wireName: r'scopeCourseName')
  String? get scopeCourseName;

  TranscriptionDto._();

  factory TranscriptionDto([void updates(TranscriptionDtoBuilder b)]) = _$TranscriptionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TranscriptionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TranscriptionDto> get serializer => _$TranscriptionDtoSerializer();
}

class _$TranscriptionDtoSerializer implements PrimitiveSerializer<TranscriptionDto> {
  @override
  final Iterable<Type> types = const [TranscriptionDto, _$TranscriptionDto];

  @override
  final String wireName = r'TranscriptionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TranscriptionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(TranscriptionStatus),
    );
    yield r'force';
    yield serializers.serialize(
      object.force,
      specifiedType: const FullType(bool),
    );
    yield r'startedAt';
    yield serializers.serialize(
      object.startedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.finishedAt != null) {
      yield r'finishedAt';
      yield serializers.serialize(
        object.finishedAt,
        specifiedType: const FullType(DateTime),
      );
    }
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
    yield r'lessonsSkipped';
    yield serializers.serialize(
      object.lessonsSkipped,
      specifiedType: const FullType(int),
    );
    yield r'lessonsTranscribed';
    yield serializers.serialize(
      object.lessonsTranscribed,
      specifiedType: const FullType(int),
    );
    yield r'lessonsFailed';
    yield serializers.serialize(
      object.lessonsFailed,
      specifiedType: const FullType(int),
    );
    yield r'errors';
    yield serializers.serialize(
      object.errors,
      specifiedType: const FullType(BuiltList, [FullType(TranscriptionErrorDto)]),
    );
    if (object.scopeCourseId != null) {
      yield r'scopeCourseId';
      yield serializers.serialize(
        object.scopeCourseId,
        specifiedType: const FullType(String),
      );
    }
    if (object.scopeCourseName != null) {
      yield r'scopeCourseName';
      yield serializers.serialize(
        object.scopeCourseName,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TranscriptionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TranscriptionDtoBuilder result,
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
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TranscriptionStatus),
          ) as TranscriptionStatus;
          result.status = valueDes;
          break;
        case r'force':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.force = valueDes;
          break;
        case r'startedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.startedAt = valueDes;
          break;
        case r'finishedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.finishedAt = valueDes;
          break;
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        case r'lessonsSkipped':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsSkipped = valueDes;
          break;
        case r'lessonsTranscribed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTranscribed = valueDes;
          break;
        case r'lessonsFailed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsFailed = valueDes;
          break;
        case r'errors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(TranscriptionErrorDto)]),
          ) as BuiltList<TranscriptionErrorDto>;
          result.errors.replace(valueDes);
          break;
        case r'scopeCourseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scopeCourseId = valueDes;
          break;
        case r'scopeCourseName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scopeCourseName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TranscriptionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TranscriptionDtoBuilder();
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


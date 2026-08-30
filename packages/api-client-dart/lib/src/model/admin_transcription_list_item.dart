//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/transcription_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_transcription_list_item.g.dart';

/// One row in the admin recent-transcriptions table. Same backbone as `TranscriptionDto` plus `libraryName` (so the table can render the library label without a second round-trip), and with the per-lesson `errors` array collapsed to `errorsCount` — a cross-library list should not ship every run's failures. Follows `AdminScanListItem`.
///
/// Properties:
/// * [transcriptionId] 
/// * [libraryId] 
/// * [libraryName] 
/// * [status] 
/// * [force] - When true, the run redid existing generated transcripts — which is why its `lessonsTotal` and `lessonsTranscribed` are close together.
/// * [startedAt] 
/// * [finishedAt] 
/// * [lessonsTotal] 
/// * [lessonsTranscribed] - Lessons for which this run produced a transcript, highlighted as a \"+N\" badge the way `coursesAdded` is for scans.
/// * [errorsCount] - Number of error records attached to this run — the same number as the run's `lessonsFailed`. Fetch the run itself for the details.
@BuiltValue()
abstract class AdminTranscriptionListItem implements Built<AdminTranscriptionListItem, AdminTranscriptionListItemBuilder> {
  @BuiltValueField(wireName: r'transcriptionId')
  String get transcriptionId;

  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  @BuiltValueField(wireName: r'libraryName')
  String get libraryName;

  @BuiltValueField(wireName: r'status')
  TranscriptionStatus get status;
  // enum statusEnum {  running,  succeeded,  failed,  cancelled,  };

  /// When true, the run redid existing generated transcripts — which is why its `lessonsTotal` and `lessonsTranscribed` are close together.
  @BuiltValueField(wireName: r'force')
  bool get force;

  @BuiltValueField(wireName: r'startedAt')
  DateTime get startedAt;

  @BuiltValueField(wireName: r'finishedAt')
  DateTime? get finishedAt;

  @BuiltValueField(wireName: r'lessonsTotal')
  int get lessonsTotal;

  /// Lessons for which this run produced a transcript, highlighted as a \"+N\" badge the way `coursesAdded` is for scans.
  @BuiltValueField(wireName: r'lessonsTranscribed')
  int get lessonsTranscribed;

  /// Number of error records attached to this run — the same number as the run's `lessonsFailed`. Fetch the run itself for the details.
  @BuiltValueField(wireName: r'errorsCount')
  int get errorsCount;

  AdminTranscriptionListItem._();

  factory AdminTranscriptionListItem([void updates(AdminTranscriptionListItemBuilder b)]) = _$AdminTranscriptionListItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminTranscriptionListItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminTranscriptionListItem> get serializer => _$AdminTranscriptionListItemSerializer();
}

class _$AdminTranscriptionListItemSerializer implements PrimitiveSerializer<AdminTranscriptionListItem> {
  @override
  final Iterable<Type> types = const [AdminTranscriptionListItem, _$AdminTranscriptionListItem];

  @override
  final String wireName = r'AdminTranscriptionListItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminTranscriptionListItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'transcriptionId';
    yield serializers.serialize(
      object.transcriptionId,
      specifiedType: const FullType(String),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
    yield r'libraryName';
    yield serializers.serialize(
      object.libraryName,
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
    yield r'finishedAt';
    yield object.finishedAt == null ? null : serializers.serialize(
      object.finishedAt,
      specifiedType: const FullType.nullable(DateTime),
    );
    yield r'lessonsTotal';
    yield serializers.serialize(
      object.lessonsTotal,
      specifiedType: const FullType(int),
    );
    yield r'lessonsTranscribed';
    yield serializers.serialize(
      object.lessonsTranscribed,
      specifiedType: const FullType(int),
    );
    yield r'errorsCount';
    yield serializers.serialize(
      object.errorsCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminTranscriptionListItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminTranscriptionListItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'transcriptionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.transcriptionId = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'libraryName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryName = valueDes;
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
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.finishedAt = valueDes;
          break;
        case r'lessonsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTotal = valueDes;
          break;
        case r'lessonsTranscribed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsTranscribed = valueDes;
          break;
        case r'errorsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.errorsCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminTranscriptionListItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminTranscriptionListItemBuilder();
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


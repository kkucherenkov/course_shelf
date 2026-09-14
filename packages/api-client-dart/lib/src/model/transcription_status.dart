//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcription_status.g.dart';

class TranscriptionStatus extends EnumClass {

  /// Transcription-run lifecycle. Mirrors `ScanStatus` with one addition: `interrupted` is written by a boot-time recovery pass when the process that owned a `running` run died (a SIGKILL, a container recreate) before it could write a terminal state itself — the run's per-lesson work is not lost, and a plain re-run finishes cheaply thanks to the skip rule. `cancelled` is reachable here because a run can also be stopped from the admin screen.
  @BuiltValueEnumConst(wireName: r'running')
  static const TranscriptionStatus running = _$running;
  /// Transcription-run lifecycle. Mirrors `ScanStatus` with one addition: `interrupted` is written by a boot-time recovery pass when the process that owned a `running` run died (a SIGKILL, a container recreate) before it could write a terminal state itself — the run's per-lesson work is not lost, and a plain re-run finishes cheaply thanks to the skip rule. `cancelled` is reachable here because a run can also be stopped from the admin screen.
  @BuiltValueEnumConst(wireName: r'succeeded')
  static const TranscriptionStatus succeeded = _$succeeded;
  /// Transcription-run lifecycle. Mirrors `ScanStatus` with one addition: `interrupted` is written by a boot-time recovery pass when the process that owned a `running` run died (a SIGKILL, a container recreate) before it could write a terminal state itself — the run's per-lesson work is not lost, and a plain re-run finishes cheaply thanks to the skip rule. `cancelled` is reachable here because a run can also be stopped from the admin screen.
  @BuiltValueEnumConst(wireName: r'failed')
  static const TranscriptionStatus failed = _$failed;
  /// Transcription-run lifecycle. Mirrors `ScanStatus` with one addition: `interrupted` is written by a boot-time recovery pass when the process that owned a `running` run died (a SIGKILL, a container recreate) before it could write a terminal state itself — the run's per-lesson work is not lost, and a plain re-run finishes cheaply thanks to the skip rule. `cancelled` is reachable here because a run can also be stopped from the admin screen.
  @BuiltValueEnumConst(wireName: r'cancelled')
  static const TranscriptionStatus cancelled = _$cancelled;
  /// Transcription-run lifecycle. Mirrors `ScanStatus` with one addition: `interrupted` is written by a boot-time recovery pass when the process that owned a `running` run died (a SIGKILL, a container recreate) before it could write a terminal state itself — the run's per-lesson work is not lost, and a plain re-run finishes cheaply thanks to the skip rule. `cancelled` is reachable here because a run can also be stopped from the admin screen.
  @BuiltValueEnumConst(wireName: r'interrupted')
  static const TranscriptionStatus interrupted = _$interrupted;

  static Serializer<TranscriptionStatus> get serializer => _$transcriptionStatusSerializer;

  const TranscriptionStatus._(String name): super(name);

  static BuiltSet<TranscriptionStatus> get values => _$values;
  static TranscriptionStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class TranscriptionStatusMixin = Object with _$TranscriptionStatusMixin;


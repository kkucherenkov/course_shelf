// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transcription_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const TranscriptionStatus _$running = const TranscriptionStatus._('running');
const TranscriptionStatus _$succeeded = const TranscriptionStatus._(
  'succeeded',
);
const TranscriptionStatus _$failed = const TranscriptionStatus._('failed');
const TranscriptionStatus _$cancelled = const TranscriptionStatus._(
  'cancelled',
);

TranscriptionStatus _$valueOf(String name) {
  switch (name) {
    case 'running':
      return _$running;
    case 'succeeded':
      return _$succeeded;
    case 'failed':
      return _$failed;
    case 'cancelled':
      return _$cancelled;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<TranscriptionStatus> _$values = BuiltSet<TranscriptionStatus>(
  const <TranscriptionStatus>[_$running, _$succeeded, _$failed, _$cancelled],
);

class _$TranscriptionStatusMeta {
  const _$TranscriptionStatusMeta();
  TranscriptionStatus get running => _$running;
  TranscriptionStatus get succeeded => _$succeeded;
  TranscriptionStatus get failed => _$failed;
  TranscriptionStatus get cancelled => _$cancelled;
  TranscriptionStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<TranscriptionStatus> get values => _$values;
}

mixin _$TranscriptionStatusMixin {
  // ignore: non_constant_identifier_names
  _$TranscriptionStatusMeta get TranscriptionStatus =>
      const _$TranscriptionStatusMeta();
}

Serializer<TranscriptionStatus> _$transcriptionStatusSerializer =
    _$TranscriptionStatusSerializer();

class _$TranscriptionStatusSerializer
    implements PrimitiveSerializer<TranscriptionStatus> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'running': 'running',
    'succeeded': 'succeeded',
    'failed': 'failed',
    'cancelled': 'cancelled',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'running': 'running',
    'succeeded': 'succeeded',
    'failed': 'failed',
    'cancelled': 'cancelled',
  };

  @override
  final Iterable<Type> types = const <Type>[TranscriptionStatus];
  @override
  final String wireName = 'TranscriptionStatus';

  @override
  Object serialize(
    Serializers serializers,
    TranscriptionStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  TranscriptionStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => TranscriptionStatus.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

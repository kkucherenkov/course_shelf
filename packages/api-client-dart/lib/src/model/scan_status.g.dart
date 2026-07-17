// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scan_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ScanStatus _$running = const ScanStatus._('running');
const ScanStatus _$succeeded = const ScanStatus._('succeeded');
const ScanStatus _$failed = const ScanStatus._('failed');
const ScanStatus _$cancelled = const ScanStatus._('cancelled');

ScanStatus _$valueOf(String name) {
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

final BuiltSet<ScanStatus> _$values = BuiltSet<ScanStatus>(const <ScanStatus>[
  _$running,
  _$succeeded,
  _$failed,
  _$cancelled,
]);

class _$ScanStatusMeta {
  const _$ScanStatusMeta();
  ScanStatus get running => _$running;
  ScanStatus get succeeded => _$succeeded;
  ScanStatus get failed => _$failed;
  ScanStatus get cancelled => _$cancelled;
  ScanStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<ScanStatus> get values => _$values;
}

mixin _$ScanStatusMixin {
  // ignore: non_constant_identifier_names
  _$ScanStatusMeta get ScanStatus => const _$ScanStatusMeta();
}

Serializer<ScanStatus> _$scanStatusSerializer = _$ScanStatusSerializer();

class _$ScanStatusSerializer implements PrimitiveSerializer<ScanStatus> {
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
  final Iterable<Type> types = const <Type>[ScanStatus];
  @override
  final String wireName = 'ScanStatus';

  @override
  Object serialize(
    Serializers serializers,
    ScanStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  ScanStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => ScanStatus.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

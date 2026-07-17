// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_item_accepted.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BatchProgressItemAcceptedStatusEnum
_$batchProgressItemAcceptedStatusEnum_accepted =
    const BatchProgressItemAcceptedStatusEnum._('accepted');

BatchProgressItemAcceptedStatusEnum
_$batchProgressItemAcceptedStatusEnumValueOf(String name) {
  switch (name) {
    case 'accepted':
      return _$batchProgressItemAcceptedStatusEnum_accepted;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BatchProgressItemAcceptedStatusEnum>
_$batchProgressItemAcceptedStatusEnumValues =
    BuiltSet<BatchProgressItemAcceptedStatusEnum>(
      const <BatchProgressItemAcceptedStatusEnum>[
        _$batchProgressItemAcceptedStatusEnum_accepted,
      ],
    );

Serializer<BatchProgressItemAcceptedStatusEnum>
_$batchProgressItemAcceptedStatusEnumSerializer =
    _$BatchProgressItemAcceptedStatusEnumSerializer();

class _$BatchProgressItemAcceptedStatusEnumSerializer
    implements PrimitiveSerializer<BatchProgressItemAcceptedStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'accepted': 'accepted',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'accepted': 'accepted',
  };

  @override
  final Iterable<Type> types = const <Type>[
    BatchProgressItemAcceptedStatusEnum,
  ];
  @override
  final String wireName = 'BatchProgressItemAcceptedStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemAcceptedStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  BatchProgressItemAcceptedStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => BatchProgressItemAcceptedStatusEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$BatchProgressItemAccepted extends BatchProgressItemAccepted {
  @override
  final BatchProgressItemAcceptedStatusEnum status;
  @override
  final LessonProgressDto state;

  factory _$BatchProgressItemAccepted([
    void Function(BatchProgressItemAcceptedBuilder)? updates,
  ]) => (BatchProgressItemAcceptedBuilder()..update(updates))._build();

  _$BatchProgressItemAccepted._({required this.status, required this.state})
    : super._();
  @override
  BatchProgressItemAccepted rebuild(
    void Function(BatchProgressItemAcceptedBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressItemAcceptedBuilder toBuilder() =>
      BatchProgressItemAcceptedBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressItemAccepted &&
        status == other.status &&
        state == other.state;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, state.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BatchProgressItemAccepted')
          ..add('status', status)
          ..add('state', state))
        .toString();
  }
}

class BatchProgressItemAcceptedBuilder
    implements
        Builder<BatchProgressItemAccepted, BatchProgressItemAcceptedBuilder> {
  _$BatchProgressItemAccepted? _$v;

  BatchProgressItemAcceptedStatusEnum? _status;
  BatchProgressItemAcceptedStatusEnum? get status => _$this._status;
  set status(BatchProgressItemAcceptedStatusEnum? status) =>
      _$this._status = status;

  LessonProgressDtoBuilder? _state;
  LessonProgressDtoBuilder get state =>
      _$this._state ??= LessonProgressDtoBuilder();
  set state(LessonProgressDtoBuilder? state) => _$this._state = state;

  BatchProgressItemAcceptedBuilder() {
    BatchProgressItemAccepted._defaults(this);
  }

  BatchProgressItemAcceptedBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _state = $v.state.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressItemAccepted other) {
    _$v = other as _$BatchProgressItemAccepted;
  }

  @override
  void update(void Function(BatchProgressItemAcceptedBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressItemAccepted build() => _build();

  _$BatchProgressItemAccepted _build() {
    _$BatchProgressItemAccepted _$result;
    try {
      _$result =
          _$v ??
          _$BatchProgressItemAccepted._(
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'BatchProgressItemAccepted',
              'status',
            ),
            state: state.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'state';
        state.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BatchProgressItemAccepted',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

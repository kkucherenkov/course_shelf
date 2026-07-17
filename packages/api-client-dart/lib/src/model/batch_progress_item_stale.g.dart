// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_item_stale.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BatchProgressItemStaleStatusEnum
_$batchProgressItemStaleStatusEnum_stale =
    const BatchProgressItemStaleStatusEnum._('stale');

BatchProgressItemStaleStatusEnum _$batchProgressItemStaleStatusEnumValueOf(
  String name,
) {
  switch (name) {
    case 'stale':
      return _$batchProgressItemStaleStatusEnum_stale;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BatchProgressItemStaleStatusEnum>
_$batchProgressItemStaleStatusEnumValues =
    BuiltSet<BatchProgressItemStaleStatusEnum>(
      const <BatchProgressItemStaleStatusEnum>[
        _$batchProgressItemStaleStatusEnum_stale,
      ],
    );

Serializer<BatchProgressItemStaleStatusEnum>
_$batchProgressItemStaleStatusEnumSerializer =
    _$BatchProgressItemStaleStatusEnumSerializer();

class _$BatchProgressItemStaleStatusEnumSerializer
    implements PrimitiveSerializer<BatchProgressItemStaleStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'stale': 'stale',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'stale': 'stale',
  };

  @override
  final Iterable<Type> types = const <Type>[BatchProgressItemStaleStatusEnum];
  @override
  final String wireName = 'BatchProgressItemStaleStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemStaleStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  BatchProgressItemStaleStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => BatchProgressItemStaleStatusEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$BatchProgressItemStale extends BatchProgressItemStale {
  @override
  final BatchProgressItemStaleStatusEnum status;
  @override
  final LessonProgressDto state;

  factory _$BatchProgressItemStale([
    void Function(BatchProgressItemStaleBuilder)? updates,
  ]) => (BatchProgressItemStaleBuilder()..update(updates))._build();

  _$BatchProgressItemStale._({required this.status, required this.state})
    : super._();
  @override
  BatchProgressItemStale rebuild(
    void Function(BatchProgressItemStaleBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressItemStaleBuilder toBuilder() =>
      BatchProgressItemStaleBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressItemStale &&
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
    return (newBuiltValueToStringHelper(r'BatchProgressItemStale')
          ..add('status', status)
          ..add('state', state))
        .toString();
  }
}

class BatchProgressItemStaleBuilder
    implements Builder<BatchProgressItemStale, BatchProgressItemStaleBuilder> {
  _$BatchProgressItemStale? _$v;

  BatchProgressItemStaleStatusEnum? _status;
  BatchProgressItemStaleStatusEnum? get status => _$this._status;
  set status(BatchProgressItemStaleStatusEnum? status) =>
      _$this._status = status;

  LessonProgressDtoBuilder? _state;
  LessonProgressDtoBuilder get state =>
      _$this._state ??= LessonProgressDtoBuilder();
  set state(LessonProgressDtoBuilder? state) => _$this._state = state;

  BatchProgressItemStaleBuilder() {
    BatchProgressItemStale._defaults(this);
  }

  BatchProgressItemStaleBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _state = $v.state.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressItemStale other) {
    _$v = other as _$BatchProgressItemStale;
  }

  @override
  void update(void Function(BatchProgressItemStaleBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressItemStale build() => _build();

  _$BatchProgressItemStale _build() {
    _$BatchProgressItemStale _$result;
    try {
      _$result =
          _$v ??
          _$BatchProgressItemStale._(
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'BatchProgressItemStale',
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
          r'BatchProgressItemStale',
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

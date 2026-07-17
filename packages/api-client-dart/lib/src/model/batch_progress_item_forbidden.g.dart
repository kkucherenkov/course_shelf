// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_item_forbidden.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BatchProgressItemForbiddenStatusEnum
_$batchProgressItemForbiddenStatusEnum_forbidden =
    const BatchProgressItemForbiddenStatusEnum._('forbidden');

BatchProgressItemForbiddenStatusEnum
_$batchProgressItemForbiddenStatusEnumValueOf(String name) {
  switch (name) {
    case 'forbidden':
      return _$batchProgressItemForbiddenStatusEnum_forbidden;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BatchProgressItemForbiddenStatusEnum>
_$batchProgressItemForbiddenStatusEnumValues =
    BuiltSet<BatchProgressItemForbiddenStatusEnum>(
      const <BatchProgressItemForbiddenStatusEnum>[
        _$batchProgressItemForbiddenStatusEnum_forbidden,
      ],
    );

Serializer<BatchProgressItemForbiddenStatusEnum>
_$batchProgressItemForbiddenStatusEnumSerializer =
    _$BatchProgressItemForbiddenStatusEnumSerializer();

class _$BatchProgressItemForbiddenStatusEnumSerializer
    implements PrimitiveSerializer<BatchProgressItemForbiddenStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'forbidden': 'forbidden',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'forbidden': 'forbidden',
  };

  @override
  final Iterable<Type> types = const <Type>[
    BatchProgressItemForbiddenStatusEnum,
  ];
  @override
  final String wireName = 'BatchProgressItemForbiddenStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemForbiddenStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  BatchProgressItemForbiddenStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => BatchProgressItemForbiddenStatusEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$BatchProgressItemForbidden extends BatchProgressItemForbidden {
  @override
  final BatchProgressItemForbiddenStatusEnum status;
  @override
  final String lessonId;

  factory _$BatchProgressItemForbidden([
    void Function(BatchProgressItemForbiddenBuilder)? updates,
  ]) => (BatchProgressItemForbiddenBuilder()..update(updates))._build();

  _$BatchProgressItemForbidden._({required this.status, required this.lessonId})
    : super._();
  @override
  BatchProgressItemForbidden rebuild(
    void Function(BatchProgressItemForbiddenBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressItemForbiddenBuilder toBuilder() =>
      BatchProgressItemForbiddenBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressItemForbidden &&
        status == other.status &&
        lessonId == other.lessonId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BatchProgressItemForbidden')
          ..add('status', status)
          ..add('lessonId', lessonId))
        .toString();
  }
}

class BatchProgressItemForbiddenBuilder
    implements
        Builder<BatchProgressItemForbidden, BatchProgressItemForbiddenBuilder> {
  _$BatchProgressItemForbidden? _$v;

  BatchProgressItemForbiddenStatusEnum? _status;
  BatchProgressItemForbiddenStatusEnum? get status => _$this._status;
  set status(BatchProgressItemForbiddenStatusEnum? status) =>
      _$this._status = status;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  BatchProgressItemForbiddenBuilder() {
    BatchProgressItemForbidden._defaults(this);
  }

  BatchProgressItemForbiddenBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _lessonId = $v.lessonId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressItemForbidden other) {
    _$v = other as _$BatchProgressItemForbidden;
  }

  @override
  void update(void Function(BatchProgressItemForbiddenBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressItemForbidden build() => _build();

  _$BatchProgressItemForbidden _build() {
    final _$result =
        _$v ??
        _$BatchProgressItemForbidden._(
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'BatchProgressItemForbidden',
            'status',
          ),
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'BatchProgressItemForbidden',
            'lessonId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

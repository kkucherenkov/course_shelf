// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_item_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BatchProgressItemResultStatusEnum
_$batchProgressItemResultStatusEnum_forbidden =
    const BatchProgressItemResultStatusEnum._('forbidden');

BatchProgressItemResultStatusEnum _$batchProgressItemResultStatusEnumValueOf(
  String name,
) {
  switch (name) {
    case 'forbidden':
      return _$batchProgressItemResultStatusEnum_forbidden;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BatchProgressItemResultStatusEnum>
_$batchProgressItemResultStatusEnumValues =
    BuiltSet<BatchProgressItemResultStatusEnum>(
      const <BatchProgressItemResultStatusEnum>[
        _$batchProgressItemResultStatusEnum_forbidden,
      ],
    );

Serializer<BatchProgressItemResultStatusEnum>
_$batchProgressItemResultStatusEnumSerializer =
    _$BatchProgressItemResultStatusEnumSerializer();

class _$BatchProgressItemResultStatusEnumSerializer
    implements PrimitiveSerializer<BatchProgressItemResultStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'forbidden': 'forbidden',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'forbidden': 'forbidden',
  };

  @override
  final Iterable<Type> types = const <Type>[BatchProgressItemResultStatusEnum];
  @override
  final String wireName = 'BatchProgressItemResultStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemResultStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  BatchProgressItemResultStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => BatchProgressItemResultStatusEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$BatchProgressItemResult extends BatchProgressItemResult {
  @override
  final OneOf oneOf;

  factory _$BatchProgressItemResult([
    void Function(BatchProgressItemResultBuilder)? updates,
  ]) => (BatchProgressItemResultBuilder()..update(updates))._build();

  _$BatchProgressItemResult._({required this.oneOf}) : super._();
  @override
  BatchProgressItemResult rebuild(
    void Function(BatchProgressItemResultBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressItemResultBuilder toBuilder() =>
      BatchProgressItemResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressItemResult && oneOf == other.oneOf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oneOf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BatchProgressItemResult',
    )..add('oneOf', oneOf)).toString();
  }
}

class BatchProgressItemResultBuilder
    implements
        Builder<BatchProgressItemResult, BatchProgressItemResultBuilder> {
  _$BatchProgressItemResult? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  BatchProgressItemResultBuilder() {
    BatchProgressItemResult._defaults(this);
  }

  BatchProgressItemResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressItemResult other) {
    _$v = other as _$BatchProgressItemResult;
  }

  @override
  void update(void Function(BatchProgressItemResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressItemResult build() => _build();

  _$BatchProgressItemResult _build() {
    final _$result =
        _$v ??
        _$BatchProgressItemResult._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
            oneOf,
            r'BatchProgressItemResult',
            'oneOf',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

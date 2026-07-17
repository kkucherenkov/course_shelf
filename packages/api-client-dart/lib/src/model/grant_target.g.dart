// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'grant_target.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const GrantTargetKindEnum _$grantTargetKindEnum_course =
    const GrantTargetKindEnum._('course');

GrantTargetKindEnum _$grantTargetKindEnumValueOf(String name) {
  switch (name) {
    case 'course':
      return _$grantTargetKindEnum_course;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<GrantTargetKindEnum> _$grantTargetKindEnumValues =
    BuiltSet<GrantTargetKindEnum>(const <GrantTargetKindEnum>[
      _$grantTargetKindEnum_course,
    ]);

Serializer<GrantTargetKindEnum> _$grantTargetKindEnumSerializer =
    _$GrantTargetKindEnumSerializer();

class _$GrantTargetKindEnumSerializer
    implements PrimitiveSerializer<GrantTargetKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'course': 'course',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'course': 'course',
  };

  @override
  final Iterable<Type> types = const <Type>[GrantTargetKindEnum];
  @override
  final String wireName = 'GrantTargetKindEnum';

  @override
  Object serialize(
    Serializers serializers,
    GrantTargetKindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  GrantTargetKindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => GrantTargetKindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$GrantTarget extends GrantTarget {
  @override
  final OneOf oneOf;

  factory _$GrantTarget([void Function(GrantTargetBuilder)? updates]) =>
      (GrantTargetBuilder()..update(updates))._build();

  _$GrantTarget._({required this.oneOf}) : super._();
  @override
  GrantTarget rebuild(void Function(GrantTargetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GrantTargetBuilder toBuilder() => GrantTargetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GrantTarget && oneOf == other.oneOf;
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
      r'GrantTarget',
    )..add('oneOf', oneOf)).toString();
  }
}

class GrantTargetBuilder implements Builder<GrantTarget, GrantTargetBuilder> {
  _$GrantTarget? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  GrantTargetBuilder() {
    GrantTarget._defaults(this);
  }

  GrantTargetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GrantTarget other) {
    _$v = other as _$GrantTarget;
  }

  @override
  void update(void Function(GrantTargetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GrantTarget build() => _build();

  _$GrantTarget _build() {
    final _$result =
        _$v ??
        _$GrantTarget._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
            oneOf,
            r'GrantTarget',
            'oneOf',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

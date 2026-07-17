// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model0.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const Model0KindEnum _$model0KindEnum_library_ = const Model0KindEnum._(
  'library_',
);

Model0KindEnum _$model0KindEnumValueOf(String name) {
  switch (name) {
    case 'library_':
      return _$model0KindEnum_library_;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<Model0KindEnum> _$model0KindEnumValues =
    BuiltSet<Model0KindEnum>(const <Model0KindEnum>[_$model0KindEnum_library_]);

Serializer<Model0KindEnum> _$model0KindEnumSerializer =
    _$Model0KindEnumSerializer();

class _$Model0KindEnumSerializer
    implements PrimitiveSerializer<Model0KindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'library_': 'library',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'library': 'library_',
  };

  @override
  final Iterable<Type> types = const <Type>[Model0KindEnum];
  @override
  final String wireName = 'Model0KindEnum';

  @override
  Object serialize(
    Serializers serializers,
    Model0KindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  Model0KindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => Model0KindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$Model0 extends Model0 {
  @override
  final Model0KindEnum kind;
  @override
  final String libraryId;

  factory _$Model0([void Function(Model0Builder)? updates]) =>
      (Model0Builder()..update(updates))._build();

  _$Model0._({required this.kind, required this.libraryId}) : super._();
  @override
  Model0 rebuild(void Function(Model0Builder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  Model0Builder toBuilder() => Model0Builder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Model0 &&
        kind == other.kind &&
        libraryId == other.libraryId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Model0')
          ..add('kind', kind)
          ..add('libraryId', libraryId))
        .toString();
  }
}

class Model0Builder implements Builder<Model0, Model0Builder> {
  _$Model0? _$v;

  Model0KindEnum? _kind;
  Model0KindEnum? get kind => _$this._kind;
  set kind(Model0KindEnum? kind) => _$this._kind = kind;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  Model0Builder() {
    Model0._defaults(this);
  }

  Model0Builder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _libraryId = $v.libraryId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Model0 other) {
    _$v = other as _$Model0;
  }

  @override
  void update(void Function(Model0Builder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Model0 build() => _build();

  _$Model0 _build() {
    final _$result =
        _$v ??
        _$Model0._(
          kind: BuiltValueNullFieldError.checkNotNull(kind, r'Model0', 'kind'),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'Model0',
            'libraryId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

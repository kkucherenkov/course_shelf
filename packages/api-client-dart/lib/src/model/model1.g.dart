// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model1.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const Model1KindEnum _$model1KindEnum_course = const Model1KindEnum._('course');

Model1KindEnum _$model1KindEnumValueOf(String name) {
  switch (name) {
    case 'course':
      return _$model1KindEnum_course;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<Model1KindEnum> _$model1KindEnumValues =
    BuiltSet<Model1KindEnum>(const <Model1KindEnum>[_$model1KindEnum_course]);

Serializer<Model1KindEnum> _$model1KindEnumSerializer =
    _$Model1KindEnumSerializer();

class _$Model1KindEnumSerializer
    implements PrimitiveSerializer<Model1KindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'course': 'course',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'course': 'course',
  };

  @override
  final Iterable<Type> types = const <Type>[Model1KindEnum];
  @override
  final String wireName = 'Model1KindEnum';

  @override
  Object serialize(
    Serializers serializers,
    Model1KindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  Model1KindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => Model1KindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$Model1 extends Model1 {
  @override
  final Model1KindEnum kind;
  @override
  final String courseId;

  factory _$Model1([void Function(Model1Builder)? updates]) =>
      (Model1Builder()..update(updates))._build();

  _$Model1._({required this.kind, required this.courseId}) : super._();
  @override
  Model1 rebuild(void Function(Model1Builder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  Model1Builder toBuilder() => Model1Builder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Model1 && kind == other.kind && courseId == other.courseId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Model1')
          ..add('kind', kind)
          ..add('courseId', courseId))
        .toString();
  }
}

class Model1Builder implements Builder<Model1, Model1Builder> {
  _$Model1? _$v;

  Model1KindEnum? _kind;
  Model1KindEnum? get kind => _$this._kind;
  set kind(Model1KindEnum? kind) => _$this._kind = kind;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  Model1Builder() {
    Model1._defaults(this);
  }

  Model1Builder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _courseId = $v.courseId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Model1 other) {
    _$v = other as _$Model1;
  }

  @override
  void update(void Function(Model1Builder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Model1 build() => _build();

  _$Model1 _build() {
    final _$result =
        _$v ??
        _$Model1._(
          kind: BuiltValueNullFieldError.checkNotNull(kind, r'Model1', 'kind'),
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'Model1',
            'courseId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

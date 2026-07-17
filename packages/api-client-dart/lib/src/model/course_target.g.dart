// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_target.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CourseTargetKindEnum _$courseTargetKindEnum_course =
    const CourseTargetKindEnum._('course');

CourseTargetKindEnum _$courseTargetKindEnumValueOf(String name) {
  switch (name) {
    case 'course':
      return _$courseTargetKindEnum_course;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CourseTargetKindEnum> _$courseTargetKindEnumValues =
    BuiltSet<CourseTargetKindEnum>(const <CourseTargetKindEnum>[
      _$courseTargetKindEnum_course,
    ]);

Serializer<CourseTargetKindEnum> _$courseTargetKindEnumSerializer =
    _$CourseTargetKindEnumSerializer();

class _$CourseTargetKindEnumSerializer
    implements PrimitiveSerializer<CourseTargetKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'course': 'course',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'course': 'course',
  };

  @override
  final Iterable<Type> types = const <Type>[CourseTargetKindEnum];
  @override
  final String wireName = 'CourseTargetKindEnum';

  @override
  Object serialize(
    Serializers serializers,
    CourseTargetKindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  CourseTargetKindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => CourseTargetKindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$CourseTarget extends CourseTarget {
  @override
  final CourseTargetKindEnum kind;
  @override
  final String courseId;

  factory _$CourseTarget([void Function(CourseTargetBuilder)? updates]) =>
      (CourseTargetBuilder()..update(updates))._build();

  _$CourseTarget._({required this.kind, required this.courseId}) : super._();
  @override
  CourseTarget rebuild(void Function(CourseTargetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CourseTargetBuilder toBuilder() => CourseTargetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseTarget &&
        kind == other.kind &&
        courseId == other.courseId;
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
    return (newBuiltValueToStringHelper(r'CourseTarget')
          ..add('kind', kind)
          ..add('courseId', courseId))
        .toString();
  }
}

class CourseTargetBuilder
    implements Builder<CourseTarget, CourseTargetBuilder> {
  _$CourseTarget? _$v;

  CourseTargetKindEnum? _kind;
  CourseTargetKindEnum? get kind => _$this._kind;
  set kind(CourseTargetKindEnum? kind) => _$this._kind = kind;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  CourseTargetBuilder() {
    CourseTarget._defaults(this);
  }

  CourseTargetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _courseId = $v.courseId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseTarget other) {
    _$v = other as _$CourseTarget;
  }

  @override
  void update(void Function(CourseTargetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseTarget build() => _build();

  _$CourseTarget _build() {
    final _$result =
        _$v ??
        _$CourseTarget._(
          kind: BuiltValueNullFieldError.checkNotNull(
            kind,
            r'CourseTarget',
            'kind',
          ),
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'CourseTarget',
            'courseId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

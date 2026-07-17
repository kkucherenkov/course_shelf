// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_level.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CourseLevel _$beginner = const CourseLevel._('beginner');
const CourseLevel _$intermediate = const CourseLevel._('intermediate');
const CourseLevel _$advanced = const CourseLevel._('advanced');
const CourseLevel _$expert = const CourseLevel._('expert');
const CourseLevel _$allLevels = const CourseLevel._('allLevels');

CourseLevel _$valueOf(String name) {
  switch (name) {
    case 'beginner':
      return _$beginner;
    case 'intermediate':
      return _$intermediate;
    case 'advanced':
      return _$advanced;
    case 'expert':
      return _$expert;
    case 'allLevels':
      return _$allLevels;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CourseLevel> _$values = BuiltSet<CourseLevel>(
  const <CourseLevel>[
    _$beginner,
    _$intermediate,
    _$advanced,
    _$expert,
    _$allLevels,
  ],
);

class _$CourseLevelMeta {
  const _$CourseLevelMeta();
  CourseLevel get beginner => _$beginner;
  CourseLevel get intermediate => _$intermediate;
  CourseLevel get advanced => _$advanced;
  CourseLevel get expert => _$expert;
  CourseLevel get allLevels => _$allLevels;
  CourseLevel valueOf(String name) => _$valueOf(name);
  BuiltSet<CourseLevel> get values => _$values;
}

mixin _$CourseLevelMixin {
  // ignore: non_constant_identifier_names
  _$CourseLevelMeta get CourseLevel => const _$CourseLevelMeta();
}

Serializer<CourseLevel> _$courseLevelSerializer = _$CourseLevelSerializer();

class _$CourseLevelSerializer implements PrimitiveSerializer<CourseLevel> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'beginner': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced',
    'expert': 'expert',
    'allLevels': 'all_levels',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'beginner': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced',
    'expert': 'expert',
    'all_levels': 'allLevels',
  };

  @override
  final Iterable<Type> types = const <Type>[CourseLevel];
  @override
  final String wireName = 'CourseLevel';

  @override
  Object serialize(
    Serializers serializers,
    CourseLevel object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  CourseLevel deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => CourseLevel.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

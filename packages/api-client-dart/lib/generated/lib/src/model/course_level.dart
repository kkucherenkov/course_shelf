//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'course_level.g.dart';

class CourseLevel extends EnumClass {

  /// Difficulty level of a course. `all_levels` is used when the course is suitable for all experience levels regardless of background.
  @BuiltValueEnumConst(wireName: r'beginner')
  static const CourseLevel beginner = _$beginner;
  /// Difficulty level of a course. `all_levels` is used when the course is suitable for all experience levels regardless of background.
  @BuiltValueEnumConst(wireName: r'intermediate')
  static const CourseLevel intermediate = _$intermediate;
  /// Difficulty level of a course. `all_levels` is used when the course is suitable for all experience levels regardless of background.
  @BuiltValueEnumConst(wireName: r'advanced')
  static const CourseLevel advanced = _$advanced;
  /// Difficulty level of a course. `all_levels` is used when the course is suitable for all experience levels regardless of background.
  @BuiltValueEnumConst(wireName: r'expert')
  static const CourseLevel expert = _$expert;
  /// Difficulty level of a course. `all_levels` is used when the course is suitable for all experience levels regardless of background.
  @BuiltValueEnumConst(wireName: r'all_levels')
  static const CourseLevel allLevels = _$allLevels;

  static Serializer<CourseLevel> get serializer => _$courseLevelSerializer;

  const CourseLevel._(String name): super(name);

  static BuiltSet<CourseLevel> get values => _$values;
  static CourseLevel valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class CourseLevelMixin = Object with _$CourseLevelMixin;


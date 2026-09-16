//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'quiz_status.g.dart';

class QuizStatus extends EnumClass {

  /// Lifecycle state of a generated quiz proposal.
  @BuiltValueEnumConst(wireName: r'proposed')
  static const QuizStatus proposed = _$proposed;
  /// Lifecycle state of a generated quiz proposal.
  @BuiltValueEnumConst(wireName: r'applied')
  static const QuizStatus applied = _$applied;
  /// Lifecycle state of a generated quiz proposal.
  @BuiltValueEnumConst(wireName: r'discarded')
  static const QuizStatus discarded = _$discarded;

  static Serializer<QuizStatus> get serializer => _$quizStatusSerializer;

  const QuizStatus._(String name): super(name);

  static BuiltSet<QuizStatus> get values => _$values;
  static QuizStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class QuizStatusMixin = Object with _$QuizStatusMixin;


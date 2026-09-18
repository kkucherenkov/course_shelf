// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quiz_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$QuizDto extends QuizDto {
  @override
  final String id;
  @override
  final String lessonId;
  @override
  final String courseId;
  @override
  final QuizStatus status;
  @override
  final String model;
  @override
  final BuiltList<QuizQuestionDto> questions;
  @override
  final DateTime createdAt;
  @override
  final DateTime? completedAt;

  factory _$QuizDto([void Function(QuizDtoBuilder)? updates]) =>
      (QuizDtoBuilder()..update(updates))._build();

  _$QuizDto._({
    required this.id,
    required this.lessonId,
    required this.courseId,
    required this.status,
    required this.model,
    required this.questions,
    required this.createdAt,
    this.completedAt,
  }) : super._();
  @override
  QuizDto rebuild(void Function(QuizDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  QuizDtoBuilder toBuilder() => QuizDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is QuizDto &&
        id == other.id &&
        lessonId == other.lessonId &&
        courseId == other.courseId &&
        status == other.status &&
        model == other.model &&
        questions == other.questions &&
        createdAt == other.createdAt &&
        completedAt == other.completedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, model.hashCode);
    _$hash = $jc(_$hash, questions.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'QuizDto')
          ..add('id', id)
          ..add('lessonId', lessonId)
          ..add('courseId', courseId)
          ..add('status', status)
          ..add('model', model)
          ..add('questions', questions)
          ..add('createdAt', createdAt)
          ..add('completedAt', completedAt))
        .toString();
  }
}

class QuizDtoBuilder implements Builder<QuizDto, QuizDtoBuilder> {
  _$QuizDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  QuizStatus? _status;
  QuizStatus? get status => _$this._status;
  set status(QuizStatus? status) => _$this._status = status;

  String? _model;
  String? get model => _$this._model;
  set model(String? model) => _$this._model = model;

  ListBuilder<QuizQuestionDto>? _questions;
  ListBuilder<QuizQuestionDto> get questions =>
      _$this._questions ??= ListBuilder<QuizQuestionDto>();
  set questions(ListBuilder<QuizQuestionDto>? questions) =>
      _$this._questions = questions;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _completedAt;
  DateTime? get completedAt => _$this._completedAt;
  set completedAt(DateTime? completedAt) => _$this._completedAt = completedAt;

  QuizDtoBuilder() {
    QuizDto._defaults(this);
  }

  QuizDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _lessonId = $v.lessonId;
      _courseId = $v.courseId;
      _status = $v.status;
      _model = $v.model;
      _questions = $v.questions.toBuilder();
      _createdAt = $v.createdAt;
      _completedAt = $v.completedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(QuizDto other) {
    _$v = other as _$QuizDto;
  }

  @override
  void update(void Function(QuizDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  QuizDto build() => _build();

  _$QuizDto _build() {
    _$QuizDto _$result;
    try {
      _$result =
          _$v ??
          _$QuizDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'QuizDto', 'id'),
            lessonId: BuiltValueNullFieldError.checkNotNull(
              lessonId,
              r'QuizDto',
              'lessonId',
            ),
            courseId: BuiltValueNullFieldError.checkNotNull(
              courseId,
              r'QuizDto',
              'courseId',
            ),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'QuizDto',
              'status',
            ),
            model: BuiltValueNullFieldError.checkNotNull(
              model,
              r'QuizDto',
              'model',
            ),
            questions: questions.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'QuizDto',
              'createdAt',
            ),
            completedAt: completedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'questions';
        questions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'QuizDto',
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

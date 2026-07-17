// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson_progress_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LessonProgressDto extends LessonProgressDto {
  @override
  final String lessonId;
  @override
  final int positionSeconds;
  @override
  final int durationSeconds;
  @override
  final num percent;
  @override
  final bool completed;
  @override
  final DateTime lastSeenAt;
  @override
  final DateTime? completedAt;

  factory _$LessonProgressDto([
    void Function(LessonProgressDtoBuilder)? updates,
  ]) => (LessonProgressDtoBuilder()..update(updates))._build();

  _$LessonProgressDto._({
    required this.lessonId,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.percent,
    required this.completed,
    required this.lastSeenAt,
    this.completedAt,
  }) : super._();
  @override
  LessonProgressDto rebuild(void Function(LessonProgressDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LessonProgressDtoBuilder toBuilder() =>
      LessonProgressDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LessonProgressDto &&
        lessonId == other.lessonId &&
        positionSeconds == other.positionSeconds &&
        durationSeconds == other.durationSeconds &&
        percent == other.percent &&
        completed == other.completed &&
        lastSeenAt == other.lastSeenAt &&
        completedAt == other.completedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, positionSeconds.hashCode);
    _$hash = $jc(_$hash, durationSeconds.hashCode);
    _$hash = $jc(_$hash, percent.hashCode);
    _$hash = $jc(_$hash, completed.hashCode);
    _$hash = $jc(_$hash, lastSeenAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LessonProgressDto')
          ..add('lessonId', lessonId)
          ..add('positionSeconds', positionSeconds)
          ..add('durationSeconds', durationSeconds)
          ..add('percent', percent)
          ..add('completed', completed)
          ..add('lastSeenAt', lastSeenAt)
          ..add('completedAt', completedAt))
        .toString();
  }
}

class LessonProgressDtoBuilder
    implements Builder<LessonProgressDto, LessonProgressDtoBuilder> {
  _$LessonProgressDto? _$v;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  int? _positionSeconds;
  int? get positionSeconds => _$this._positionSeconds;
  set positionSeconds(int? positionSeconds) =>
      _$this._positionSeconds = positionSeconds;

  int? _durationSeconds;
  int? get durationSeconds => _$this._durationSeconds;
  set durationSeconds(int? durationSeconds) =>
      _$this._durationSeconds = durationSeconds;

  num? _percent;
  num? get percent => _$this._percent;
  set percent(num? percent) => _$this._percent = percent;

  bool? _completed;
  bool? get completed => _$this._completed;
  set completed(bool? completed) => _$this._completed = completed;

  DateTime? _lastSeenAt;
  DateTime? get lastSeenAt => _$this._lastSeenAt;
  set lastSeenAt(DateTime? lastSeenAt) => _$this._lastSeenAt = lastSeenAt;

  DateTime? _completedAt;
  DateTime? get completedAt => _$this._completedAt;
  set completedAt(DateTime? completedAt) => _$this._completedAt = completedAt;

  LessonProgressDtoBuilder() {
    LessonProgressDto._defaults(this);
  }

  LessonProgressDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lessonId = $v.lessonId;
      _positionSeconds = $v.positionSeconds;
      _durationSeconds = $v.durationSeconds;
      _percent = $v.percent;
      _completed = $v.completed;
      _lastSeenAt = $v.lastSeenAt;
      _completedAt = $v.completedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LessonProgressDto other) {
    _$v = other as _$LessonProgressDto;
  }

  @override
  void update(void Function(LessonProgressDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LessonProgressDto build() => _build();

  _$LessonProgressDto _build() {
    final _$result =
        _$v ??
        _$LessonProgressDto._(
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'LessonProgressDto',
            'lessonId',
          ),
          positionSeconds: BuiltValueNullFieldError.checkNotNull(
            positionSeconds,
            r'LessonProgressDto',
            'positionSeconds',
          ),
          durationSeconds: BuiltValueNullFieldError.checkNotNull(
            durationSeconds,
            r'LessonProgressDto',
            'durationSeconds',
          ),
          percent: BuiltValueNullFieldError.checkNotNull(
            percent,
            r'LessonProgressDto',
            'percent',
          ),
          completed: BuiltValueNullFieldError.checkNotNull(
            completed,
            r'LessonProgressDto',
            'completed',
          ),
          lastSeenAt: BuiltValueNullFieldError.checkNotNull(
            lastSeenAt,
            r'LessonProgressDto',
            'lastSeenAt',
          ),
          completedAt: completedAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

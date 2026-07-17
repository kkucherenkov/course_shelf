// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson_progress.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LessonProgress extends LessonProgress {
  @override
  final num percent;
  @override
  final bool completed;
  @override
  final int lastSeenAtSeconds;

  factory _$LessonProgress([void Function(LessonProgressBuilder)? updates]) =>
      (LessonProgressBuilder()..update(updates))._build();

  _$LessonProgress._({
    required this.percent,
    required this.completed,
    required this.lastSeenAtSeconds,
  }) : super._();
  @override
  LessonProgress rebuild(void Function(LessonProgressBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LessonProgressBuilder toBuilder() => LessonProgressBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LessonProgress &&
        percent == other.percent &&
        completed == other.completed &&
        lastSeenAtSeconds == other.lastSeenAtSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, percent.hashCode);
    _$hash = $jc(_$hash, completed.hashCode);
    _$hash = $jc(_$hash, lastSeenAtSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LessonProgress')
          ..add('percent', percent)
          ..add('completed', completed)
          ..add('lastSeenAtSeconds', lastSeenAtSeconds))
        .toString();
  }
}

class LessonProgressBuilder
    implements Builder<LessonProgress, LessonProgressBuilder> {
  _$LessonProgress? _$v;

  num? _percent;
  num? get percent => _$this._percent;
  set percent(num? percent) => _$this._percent = percent;

  bool? _completed;
  bool? get completed => _$this._completed;
  set completed(bool? completed) => _$this._completed = completed;

  int? _lastSeenAtSeconds;
  int? get lastSeenAtSeconds => _$this._lastSeenAtSeconds;
  set lastSeenAtSeconds(int? lastSeenAtSeconds) =>
      _$this._lastSeenAtSeconds = lastSeenAtSeconds;

  LessonProgressBuilder() {
    LessonProgress._defaults(this);
  }

  LessonProgressBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _percent = $v.percent;
      _completed = $v.completed;
      _lastSeenAtSeconds = $v.lastSeenAtSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LessonProgress other) {
    _$v = other as _$LessonProgress;
  }

  @override
  void update(void Function(LessonProgressBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LessonProgress build() => _build();

  _$LessonProgress _build() {
    final _$result =
        _$v ??
        _$LessonProgress._(
          percent: BuiltValueNullFieldError.checkNotNull(
            percent,
            r'LessonProgress',
            'percent',
          ),
          completed: BuiltValueNullFieldError.checkNotNull(
            completed,
            r'LessonProgress',
            'completed',
          ),
          lastSeenAtSeconds: BuiltValueNullFieldError.checkNotNull(
            lastSeenAtSeconds,
            r'LessonProgress',
            'lastSeenAtSeconds',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

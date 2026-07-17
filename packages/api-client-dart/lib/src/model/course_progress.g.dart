// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_progress.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseProgress extends CourseProgress {
  @override
  final num percent;
  @override
  final int lessonsCompleted;
  @override
  final int lessonsTotal;

  factory _$CourseProgress([void Function(CourseProgressBuilder)? updates]) =>
      (CourseProgressBuilder()..update(updates))._build();

  _$CourseProgress._({
    required this.percent,
    required this.lessonsCompleted,
    required this.lessonsTotal,
  }) : super._();
  @override
  CourseProgress rebuild(void Function(CourseProgressBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CourseProgressBuilder toBuilder() => CourseProgressBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseProgress &&
        percent == other.percent &&
        lessonsCompleted == other.lessonsCompleted &&
        lessonsTotal == other.lessonsTotal;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, percent.hashCode);
    _$hash = $jc(_$hash, lessonsCompleted.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseProgress')
          ..add('percent', percent)
          ..add('lessonsCompleted', lessonsCompleted)
          ..add('lessonsTotal', lessonsTotal))
        .toString();
  }
}

class CourseProgressBuilder
    implements Builder<CourseProgress, CourseProgressBuilder> {
  _$CourseProgress? _$v;

  num? _percent;
  num? get percent => _$this._percent;
  set percent(num? percent) => _$this._percent = percent;

  int? _lessonsCompleted;
  int? get lessonsCompleted => _$this._lessonsCompleted;
  set lessonsCompleted(int? lessonsCompleted) =>
      _$this._lessonsCompleted = lessonsCompleted;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  CourseProgressBuilder() {
    CourseProgress._defaults(this);
  }

  CourseProgressBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _percent = $v.percent;
      _lessonsCompleted = $v.lessonsCompleted;
      _lessonsTotal = $v.lessonsTotal;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseProgress other) {
    _$v = other as _$CourseProgress;
  }

  @override
  void update(void Function(CourseProgressBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseProgress build() => _build();

  _$CourseProgress _build() {
    final _$result =
        _$v ??
        _$CourseProgress._(
          percent: BuiltValueNullFieldError.checkNotNull(
            percent,
            r'CourseProgress',
            'percent',
          ),
          lessonsCompleted: BuiltValueNullFieldError.checkNotNull(
            lessonsCompleted,
            r'CourseProgress',
            'lessonsCompleted',
          ),
          lessonsTotal: BuiltValueNullFieldError.checkNotNull(
            lessonsTotal,
            r'CourseProgress',
            'lessonsTotal',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

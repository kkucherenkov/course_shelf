// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'your_week_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$YourWeekDto extends YourWeekDto {
  @override
  final int minutesWatched;
  @override
  final int lessonsCompleted;
  @override
  final DateRange range;

  factory _$YourWeekDto([void Function(YourWeekDtoBuilder)? updates]) =>
      (YourWeekDtoBuilder()..update(updates))._build();

  _$YourWeekDto._({
    required this.minutesWatched,
    required this.lessonsCompleted,
    required this.range,
  }) : super._();
  @override
  YourWeekDto rebuild(void Function(YourWeekDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  YourWeekDtoBuilder toBuilder() => YourWeekDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is YourWeekDto &&
        minutesWatched == other.minutesWatched &&
        lessonsCompleted == other.lessonsCompleted &&
        range == other.range;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, minutesWatched.hashCode);
    _$hash = $jc(_$hash, lessonsCompleted.hashCode);
    _$hash = $jc(_$hash, range.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'YourWeekDto')
          ..add('minutesWatched', minutesWatched)
          ..add('lessonsCompleted', lessonsCompleted)
          ..add('range', range))
        .toString();
  }
}

class YourWeekDtoBuilder implements Builder<YourWeekDto, YourWeekDtoBuilder> {
  _$YourWeekDto? _$v;

  int? _minutesWatched;
  int? get minutesWatched => _$this._minutesWatched;
  set minutesWatched(int? minutesWatched) =>
      _$this._minutesWatched = minutesWatched;

  int? _lessonsCompleted;
  int? get lessonsCompleted => _$this._lessonsCompleted;
  set lessonsCompleted(int? lessonsCompleted) =>
      _$this._lessonsCompleted = lessonsCompleted;

  DateRangeBuilder? _range;
  DateRangeBuilder get range => _$this._range ??= DateRangeBuilder();
  set range(DateRangeBuilder? range) => _$this._range = range;

  YourWeekDtoBuilder() {
    YourWeekDto._defaults(this);
  }

  YourWeekDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _minutesWatched = $v.minutesWatched;
      _lessonsCompleted = $v.lessonsCompleted;
      _range = $v.range.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(YourWeekDto other) {
    _$v = other as _$YourWeekDto;
  }

  @override
  void update(void Function(YourWeekDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  YourWeekDto build() => _build();

  _$YourWeekDto _build() {
    _$YourWeekDto _$result;
    try {
      _$result =
          _$v ??
          _$YourWeekDto._(
            minutesWatched: BuiltValueNullFieldError.checkNotNull(
              minutesWatched,
              r'YourWeekDto',
              'minutesWatched',
            ),
            lessonsCompleted: BuiltValueNullFieldError.checkNotNull(
              lessonsCompleted,
              r'YourWeekDto',
              'lessonsCompleted',
            ),
            range: range.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'range';
        range.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'YourWeekDto',
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

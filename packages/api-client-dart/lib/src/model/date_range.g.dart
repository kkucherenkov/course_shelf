// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'date_range.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DateRange extends DateRange {
  @override
  final DateTime from;
  @override
  final DateTime to;

  factory _$DateRange([void Function(DateRangeBuilder)? updates]) =>
      (DateRangeBuilder()..update(updates))._build();

  _$DateRange._({required this.from, required this.to}) : super._();
  @override
  DateRange rebuild(void Function(DateRangeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DateRangeBuilder toBuilder() => DateRangeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DateRange && from == other.from && to == other.to;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, from.hashCode);
    _$hash = $jc(_$hash, to.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DateRange')
          ..add('from', from)
          ..add('to', to))
        .toString();
  }
}

class DateRangeBuilder implements Builder<DateRange, DateRangeBuilder> {
  _$DateRange? _$v;

  DateTime? _from;
  DateTime? get from => _$this._from;
  set from(DateTime? from) => _$this._from = from;

  DateTime? _to;
  DateTime? get to => _$this._to;
  set to(DateTime? to) => _$this._to = to;

  DateRangeBuilder() {
    DateRange._defaults(this);
  }

  DateRangeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _from = $v.from;
      _to = $v.to;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DateRange other) {
    _$v = other as _$DateRange;
  }

  @override
  void update(void Function(DateRangeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DateRange build() => _build();

  _$DateRange _build() {
    final _$result =
        _$v ??
        _$DateRange._(
          from: BuiltValueNullFieldError.checkNotNull(
            from,
            r'DateRange',
            'from',
          ),
          to: BuiltValueNullFieldError.checkNotNull(to, r'DateRange', 'to'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

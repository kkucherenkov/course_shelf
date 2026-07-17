// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recently_completed_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentlyCompletedDto extends RecentlyCompletedDto {
  @override
  final BuiltList<RecentlyCompletedItem> items;

  factory _$RecentlyCompletedDto([
    void Function(RecentlyCompletedDtoBuilder)? updates,
  ]) => (RecentlyCompletedDtoBuilder()..update(updates))._build();

  _$RecentlyCompletedDto._({required this.items}) : super._();
  @override
  RecentlyCompletedDto rebuild(
    void Function(RecentlyCompletedDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RecentlyCompletedDtoBuilder toBuilder() =>
      RecentlyCompletedDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentlyCompletedDto && items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'RecentlyCompletedDto',
    )..add('items', items)).toString();
  }
}

class RecentlyCompletedDtoBuilder
    implements Builder<RecentlyCompletedDto, RecentlyCompletedDtoBuilder> {
  _$RecentlyCompletedDto? _$v;

  ListBuilder<RecentlyCompletedItem>? _items;
  ListBuilder<RecentlyCompletedItem> get items =>
      _$this._items ??= ListBuilder<RecentlyCompletedItem>();
  set items(ListBuilder<RecentlyCompletedItem>? items) => _$this._items = items;

  RecentlyCompletedDtoBuilder() {
    RecentlyCompletedDto._defaults(this);
  }

  RecentlyCompletedDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentlyCompletedDto other) {
    _$v = other as _$RecentlyCompletedDto;
  }

  @override
  void update(void Function(RecentlyCompletedDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentlyCompletedDto build() => _build();

  _$RecentlyCompletedDto _build() {
    _$RecentlyCompletedDto _$result;
    try {
      _$result = _$v ?? _$RecentlyCompletedDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'RecentlyCompletedDto',
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

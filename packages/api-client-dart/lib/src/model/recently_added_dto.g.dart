// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recently_added_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentlyAddedDto extends RecentlyAddedDto {
  @override
  final BuiltList<RecentlyAddedItem> items;

  factory _$RecentlyAddedDto([
    void Function(RecentlyAddedDtoBuilder)? updates,
  ]) => (RecentlyAddedDtoBuilder()..update(updates))._build();

  _$RecentlyAddedDto._({required this.items}) : super._();
  @override
  RecentlyAddedDto rebuild(void Function(RecentlyAddedDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecentlyAddedDtoBuilder toBuilder() =>
      RecentlyAddedDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentlyAddedDto && items == other.items;
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
      r'RecentlyAddedDto',
    )..add('items', items)).toString();
  }
}

class RecentlyAddedDtoBuilder
    implements Builder<RecentlyAddedDto, RecentlyAddedDtoBuilder> {
  _$RecentlyAddedDto? _$v;

  ListBuilder<RecentlyAddedItem>? _items;
  ListBuilder<RecentlyAddedItem> get items =>
      _$this._items ??= ListBuilder<RecentlyAddedItem>();
  set items(ListBuilder<RecentlyAddedItem>? items) => _$this._items = items;

  RecentlyAddedDtoBuilder() {
    RecentlyAddedDto._defaults(this);
  }

  RecentlyAddedDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentlyAddedDto other) {
    _$v = other as _$RecentlyAddedDto;
  }

  @override
  void update(void Function(RecentlyAddedDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentlyAddedDto build() => _build();

  _$RecentlyAddedDto _build() {
    _$RecentlyAddedDto _$result;
    try {
      _$result = _$v ?? _$RecentlyAddedDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'RecentlyAddedDto',
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

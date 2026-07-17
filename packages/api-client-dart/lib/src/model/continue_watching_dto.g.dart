// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'continue_watching_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ContinueWatchingDto extends ContinueWatchingDto {
  @override
  final BuiltList<ContinueWatchingItem> items;

  factory _$ContinueWatchingDto([
    void Function(ContinueWatchingDtoBuilder)? updates,
  ]) => (ContinueWatchingDtoBuilder()..update(updates))._build();

  _$ContinueWatchingDto._({required this.items}) : super._();
  @override
  ContinueWatchingDto rebuild(
    void Function(ContinueWatchingDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ContinueWatchingDtoBuilder toBuilder() =>
      ContinueWatchingDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ContinueWatchingDto && items == other.items;
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
      r'ContinueWatchingDto',
    )..add('items', items)).toString();
  }
}

class ContinueWatchingDtoBuilder
    implements Builder<ContinueWatchingDto, ContinueWatchingDtoBuilder> {
  _$ContinueWatchingDto? _$v;

  ListBuilder<ContinueWatchingItem>? _items;
  ListBuilder<ContinueWatchingItem> get items =>
      _$this._items ??= ListBuilder<ContinueWatchingItem>();
  set items(ListBuilder<ContinueWatchingItem>? items) => _$this._items = items;

  ContinueWatchingDtoBuilder() {
    ContinueWatchingDto._defaults(this);
  }

  ContinueWatchingDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ContinueWatchingDto other) {
    _$v = other as _$ContinueWatchingDto;
  }

  @override
  void update(void Function(ContinueWatchingDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ContinueWatchingDto build() => _build();

  _$ContinueWatchingDto _build() {
    _$ContinueWatchingDto _$result;
    try {
      _$result = _$v ?? _$ContinueWatchingDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ContinueWatchingDto',
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

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'access_grant_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AccessGrantListDto extends AccessGrantListDto {
  @override
  final BuiltList<AccessGrantDto> items;

  factory _$AccessGrantListDto([
    void Function(AccessGrantListDtoBuilder)? updates,
  ]) => (AccessGrantListDtoBuilder()..update(updates))._build();

  _$AccessGrantListDto._({required this.items}) : super._();
  @override
  AccessGrantListDto rebuild(
    void Function(AccessGrantListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AccessGrantListDtoBuilder toBuilder() =>
      AccessGrantListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AccessGrantListDto && items == other.items;
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
      r'AccessGrantListDto',
    )..add('items', items)).toString();
  }
}

class AccessGrantListDtoBuilder
    implements Builder<AccessGrantListDto, AccessGrantListDtoBuilder> {
  _$AccessGrantListDto? _$v;

  ListBuilder<AccessGrantDto>? _items;
  ListBuilder<AccessGrantDto> get items =>
      _$this._items ??= ListBuilder<AccessGrantDto>();
  set items(ListBuilder<AccessGrantDto>? items) => _$this._items = items;

  AccessGrantListDtoBuilder() {
    AccessGrantListDto._defaults(this);
  }

  AccessGrantListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AccessGrantListDto other) {
    _$v = other as _$AccessGrantListDto;
  }

  @override
  void update(void Function(AccessGrantListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AccessGrantListDto build() => _build();

  _$AccessGrantListDto _build() {
    _$AccessGrantListDto _$result;
    try {
      _$result = _$v ?? _$AccessGrantListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AccessGrantListDto',
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

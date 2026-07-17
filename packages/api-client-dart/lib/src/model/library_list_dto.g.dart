// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LibraryListDto extends LibraryListDto {
  @override
  final BuiltList<LibraryDto> items;

  factory _$LibraryListDto([void Function(LibraryListDtoBuilder)? updates]) =>
      (LibraryListDtoBuilder()..update(updates))._build();

  _$LibraryListDto._({required this.items}) : super._();
  @override
  LibraryListDto rebuild(void Function(LibraryListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryListDtoBuilder toBuilder() => LibraryListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryListDto && items == other.items;
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
      r'LibraryListDto',
    )..add('items', items)).toString();
  }
}

class LibraryListDtoBuilder
    implements Builder<LibraryListDto, LibraryListDtoBuilder> {
  _$LibraryListDto? _$v;

  ListBuilder<LibraryDto>? _items;
  ListBuilder<LibraryDto> get items =>
      _$this._items ??= ListBuilder<LibraryDto>();
  set items(ListBuilder<LibraryDto>? items) => _$this._items = items;

  LibraryListDtoBuilder() {
    LibraryListDto._defaults(this);
  }

  LibraryListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryListDto other) {
    _$v = other as _$LibraryListDto;
  }

  @override
  void update(void Function(LibraryListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryListDto build() => _build();

  _$LibraryListDto _build() {
    _$LibraryListDto _$result;
    try {
      _$result = _$v ?? _$LibraryListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'LibraryListDto',
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

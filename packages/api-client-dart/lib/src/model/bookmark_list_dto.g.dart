// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bookmark_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BookmarkListDto extends BookmarkListDto {
  @override
  final BuiltList<BookmarkDto> items;

  factory _$BookmarkListDto([void Function(BookmarkListDtoBuilder)? updates]) =>
      (BookmarkListDtoBuilder()..update(updates))._build();

  _$BookmarkListDto._({required this.items}) : super._();
  @override
  BookmarkListDto rebuild(void Function(BookmarkListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BookmarkListDtoBuilder toBuilder() => BookmarkListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BookmarkListDto && items == other.items;
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
      r'BookmarkListDto',
    )..add('items', items)).toString();
  }
}

class BookmarkListDtoBuilder
    implements Builder<BookmarkListDto, BookmarkListDtoBuilder> {
  _$BookmarkListDto? _$v;

  ListBuilder<BookmarkDto>? _items;
  ListBuilder<BookmarkDto> get items =>
      _$this._items ??= ListBuilder<BookmarkDto>();
  set items(ListBuilder<BookmarkDto>? items) => _$this._items = items;

  BookmarkListDtoBuilder() {
    BookmarkListDto._defaults(this);
  }

  BookmarkListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BookmarkListDto other) {
    _$v = other as _$BookmarkListDto;
  }

  @override
  void update(void Function(BookmarkListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BookmarkListDto build() => _build();

  _$BookmarkListDto _build() {
    _$BookmarkListDto _$result;
    try {
      _$result = _$v ?? _$BookmarkListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BookmarkListDto',
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

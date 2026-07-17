// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagListDto extends TagListDto {
  @override
  final BuiltList<TagDto> items;
  @override
  final int total;
  @override
  final int offset;
  @override
  final int limit;

  factory _$TagListDto([void Function(TagListDtoBuilder)? updates]) =>
      (TagListDtoBuilder()..update(updates))._build();

  _$TagListDto._({
    required this.items,
    required this.total,
    required this.offset,
    required this.limit,
  }) : super._();
  @override
  TagListDto rebuild(void Function(TagListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagListDtoBuilder toBuilder() => TagListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagListDto &&
        items == other.items &&
        total == other.total &&
        offset == other.offset &&
        limit == other.limit;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, offset.hashCode);
    _$hash = $jc(_$hash, limit.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagListDto')
          ..add('items', items)
          ..add('total', total)
          ..add('offset', offset)
          ..add('limit', limit))
        .toString();
  }
}

class TagListDtoBuilder implements Builder<TagListDto, TagListDtoBuilder> {
  _$TagListDto? _$v;

  ListBuilder<TagDto>? _items;
  ListBuilder<TagDto> get items => _$this._items ??= ListBuilder<TagDto>();
  set items(ListBuilder<TagDto>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  int? _offset;
  int? get offset => _$this._offset;
  set offset(int? offset) => _$this._offset = offset;

  int? _limit;
  int? get limit => _$this._limit;
  set limit(int? limit) => _$this._limit = limit;

  TagListDtoBuilder() {
    TagListDto._defaults(this);
  }

  TagListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _offset = $v.offset;
      _limit = $v.limit;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagListDto other) {
    _$v = other as _$TagListDto;
  }

  @override
  void update(void Function(TagListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagListDto build() => _build();

  _$TagListDto _build() {
    _$TagListDto _$result;
    try {
      _$result =
          _$v ??
          _$TagListDto._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
              total,
              r'TagListDto',
              'total',
            ),
            offset: BuiltValueNullFieldError.checkNotNull(
              offset,
              r'TagListDto',
              'offset',
            ),
            limit: BuiltValueNullFieldError.checkNotNull(
              limit,
              r'TagListDto',
              'limit',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'TagListDto',
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

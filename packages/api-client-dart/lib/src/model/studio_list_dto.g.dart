// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studio_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StudioListDto extends StudioListDto {
  @override
  final BuiltList<StudioDto> items;
  @override
  final int total;
  @override
  final int offset;
  @override
  final int limit;

  factory _$StudioListDto([void Function(StudioListDtoBuilder)? updates]) =>
      (StudioListDtoBuilder()..update(updates))._build();

  _$StudioListDto._({
    required this.items,
    required this.total,
    required this.offset,
    required this.limit,
  }) : super._();
  @override
  StudioListDto rebuild(void Function(StudioListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StudioListDtoBuilder toBuilder() => StudioListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StudioListDto &&
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
    return (newBuiltValueToStringHelper(r'StudioListDto')
          ..add('items', items)
          ..add('total', total)
          ..add('offset', offset)
          ..add('limit', limit))
        .toString();
  }
}

class StudioListDtoBuilder
    implements Builder<StudioListDto, StudioListDtoBuilder> {
  _$StudioListDto? _$v;

  ListBuilder<StudioDto>? _items;
  ListBuilder<StudioDto> get items =>
      _$this._items ??= ListBuilder<StudioDto>();
  set items(ListBuilder<StudioDto>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  int? _offset;
  int? get offset => _$this._offset;
  set offset(int? offset) => _$this._offset = offset;

  int? _limit;
  int? get limit => _$this._limit;
  set limit(int? limit) => _$this._limit = limit;

  StudioListDtoBuilder() {
    StudioListDto._defaults(this);
  }

  StudioListDtoBuilder get _$this {
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
  void replace(StudioListDto other) {
    _$v = other as _$StudioListDto;
  }

  @override
  void update(void Function(StudioListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StudioListDto build() => _build();

  _$StudioListDto _build() {
    _$StudioListDto _$result;
    try {
      _$result =
          _$v ??
          _$StudioListDto._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
              total,
              r'StudioListDto',
              'total',
            ),
            offset: BuiltValueNullFieldError.checkNotNull(
              offset,
              r'StudioListDto',
              'offset',
            ),
            limit: BuiltValueNullFieldError.checkNotNull(
              limit,
              r'StudioListDto',
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
          r'StudioListDto',
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

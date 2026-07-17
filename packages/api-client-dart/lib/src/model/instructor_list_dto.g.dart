// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'instructor_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstructorListDto extends InstructorListDto {
  @override
  final BuiltList<InstructorDto> items;
  @override
  final int total;
  @override
  final int offset;
  @override
  final int limit;

  factory _$InstructorListDto([
    void Function(InstructorListDtoBuilder)? updates,
  ]) => (InstructorListDtoBuilder()..update(updates))._build();

  _$InstructorListDto._({
    required this.items,
    required this.total,
    required this.offset,
    required this.limit,
  }) : super._();
  @override
  InstructorListDto rebuild(void Function(InstructorListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InstructorListDtoBuilder toBuilder() =>
      InstructorListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstructorListDto &&
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
    return (newBuiltValueToStringHelper(r'InstructorListDto')
          ..add('items', items)
          ..add('total', total)
          ..add('offset', offset)
          ..add('limit', limit))
        .toString();
  }
}

class InstructorListDtoBuilder
    implements Builder<InstructorListDto, InstructorListDtoBuilder> {
  _$InstructorListDto? _$v;

  ListBuilder<InstructorDto>? _items;
  ListBuilder<InstructorDto> get items =>
      _$this._items ??= ListBuilder<InstructorDto>();
  set items(ListBuilder<InstructorDto>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  int? _offset;
  int? get offset => _$this._offset;
  set offset(int? offset) => _$this._offset = offset;

  int? _limit;
  int? get limit => _$this._limit;
  set limit(int? limit) => _$this._limit = limit;

  InstructorListDtoBuilder() {
    InstructorListDto._defaults(this);
  }

  InstructorListDtoBuilder get _$this {
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
  void replace(InstructorListDto other) {
    _$v = other as _$InstructorListDto;
  }

  @override
  void update(void Function(InstructorListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstructorListDto build() => _build();

  _$InstructorListDto _build() {
    _$InstructorListDto _$result;
    try {
      _$result =
          _$v ??
          _$InstructorListDto._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
              total,
              r'InstructorListDto',
              'total',
            ),
            offset: BuiltValueNullFieldError.checkNotNull(
              offset,
              r'InstructorListDto',
              'offset',
            ),
            limit: BuiltValueNullFieldError.checkNotNull(
              limit,
              r'InstructorListDto',
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
          r'InstructorListDto',
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

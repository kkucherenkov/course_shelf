// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'flashcard_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FlashcardListDto extends FlashcardListDto {
  @override
  final BuiltList<FlashcardDto> items;

  factory _$FlashcardListDto([
    void Function(FlashcardListDtoBuilder)? updates,
  ]) => (FlashcardListDtoBuilder()..update(updates))._build();

  _$FlashcardListDto._({required this.items}) : super._();
  @override
  FlashcardListDto rebuild(void Function(FlashcardListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FlashcardListDtoBuilder toBuilder() =>
      FlashcardListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FlashcardListDto && items == other.items;
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
      r'FlashcardListDto',
    )..add('items', items)).toString();
  }
}

class FlashcardListDtoBuilder
    implements Builder<FlashcardListDto, FlashcardListDtoBuilder> {
  _$FlashcardListDto? _$v;

  ListBuilder<FlashcardDto>? _items;
  ListBuilder<FlashcardDto> get items =>
      _$this._items ??= ListBuilder<FlashcardDto>();
  set items(ListBuilder<FlashcardDto>? items) => _$this._items = items;

  FlashcardListDtoBuilder() {
    FlashcardListDto._defaults(this);
  }

  FlashcardListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FlashcardListDto other) {
    _$v = other as _$FlashcardListDto;
  }

  @override
  void update(void Function(FlashcardListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FlashcardListDto build() => _build();

  _$FlashcardListDto _build() {
    _$FlashcardListDto _$result;
    try {
      _$result = _$v ?? _$FlashcardListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'FlashcardListDto',
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

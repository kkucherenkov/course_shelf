// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transcription_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TranscriptionListDto extends TranscriptionListDto {
  @override
  final BuiltList<TranscriptionDto> items;

  factory _$TranscriptionListDto([
    void Function(TranscriptionListDtoBuilder)? updates,
  ]) => (TranscriptionListDtoBuilder()..update(updates))._build();

  _$TranscriptionListDto._({required this.items}) : super._();
  @override
  TranscriptionListDto rebuild(
    void Function(TranscriptionListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  TranscriptionListDtoBuilder toBuilder() =>
      TranscriptionListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TranscriptionListDto && items == other.items;
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
      r'TranscriptionListDto',
    )..add('items', items)).toString();
  }
}

class TranscriptionListDtoBuilder
    implements Builder<TranscriptionListDto, TranscriptionListDtoBuilder> {
  _$TranscriptionListDto? _$v;

  ListBuilder<TranscriptionDto>? _items;
  ListBuilder<TranscriptionDto> get items =>
      _$this._items ??= ListBuilder<TranscriptionDto>();
  set items(ListBuilder<TranscriptionDto>? items) => _$this._items = items;

  TranscriptionListDtoBuilder() {
    TranscriptionListDto._defaults(this);
  }

  TranscriptionListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TranscriptionListDto other) {
    _$v = other as _$TranscriptionListDto;
  }

  @override
  void update(void Function(TranscriptionListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TranscriptionListDto build() => _build();

  _$TranscriptionListDto _build() {
    _$TranscriptionListDto _$result;
    try {
      _$result = _$v ?? _$TranscriptionListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'TranscriptionListDto',
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

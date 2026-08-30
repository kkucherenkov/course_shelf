// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_transcription_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminTranscriptionListDto extends AdminTranscriptionListDto {
  @override
  final BuiltList<AdminTranscriptionListItem> items;

  factory _$AdminTranscriptionListDto([
    void Function(AdminTranscriptionListDtoBuilder)? updates,
  ]) => (AdminTranscriptionListDtoBuilder()..update(updates))._build();

  _$AdminTranscriptionListDto._({required this.items}) : super._();
  @override
  AdminTranscriptionListDto rebuild(
    void Function(AdminTranscriptionListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminTranscriptionListDtoBuilder toBuilder() =>
      AdminTranscriptionListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminTranscriptionListDto && items == other.items;
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
      r'AdminTranscriptionListDto',
    )..add('items', items)).toString();
  }
}

class AdminTranscriptionListDtoBuilder
    implements
        Builder<AdminTranscriptionListDto, AdminTranscriptionListDtoBuilder> {
  _$AdminTranscriptionListDto? _$v;

  ListBuilder<AdminTranscriptionListItem>? _items;
  ListBuilder<AdminTranscriptionListItem> get items =>
      _$this._items ??= ListBuilder<AdminTranscriptionListItem>();
  set items(ListBuilder<AdminTranscriptionListItem>? items) =>
      _$this._items = items;

  AdminTranscriptionListDtoBuilder() {
    AdminTranscriptionListDto._defaults(this);
  }

  AdminTranscriptionListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminTranscriptionListDto other) {
    _$v = other as _$AdminTranscriptionListDto;
  }

  @override
  void update(void Function(AdminTranscriptionListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminTranscriptionListDto build() => _build();

  _$AdminTranscriptionListDto _build() {
    _$AdminTranscriptionListDto _$result;
    try {
      _$result = _$v ?? _$AdminTranscriptionListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminTranscriptionListDto',
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

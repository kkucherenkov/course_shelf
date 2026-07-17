// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_scan_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminScanListDto extends AdminScanListDto {
  @override
  final BuiltList<AdminScanListItem> items;

  factory _$AdminScanListDto([
    void Function(AdminScanListDtoBuilder)? updates,
  ]) => (AdminScanListDtoBuilder()..update(updates))._build();

  _$AdminScanListDto._({required this.items}) : super._();
  @override
  AdminScanListDto rebuild(void Function(AdminScanListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminScanListDtoBuilder toBuilder() =>
      AdminScanListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminScanListDto && items == other.items;
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
      r'AdminScanListDto',
    )..add('items', items)).toString();
  }
}

class AdminScanListDtoBuilder
    implements Builder<AdminScanListDto, AdminScanListDtoBuilder> {
  _$AdminScanListDto? _$v;

  ListBuilder<AdminScanListItem>? _items;
  ListBuilder<AdminScanListItem> get items =>
      _$this._items ??= ListBuilder<AdminScanListItem>();
  set items(ListBuilder<AdminScanListItem>? items) => _$this._items = items;

  AdminScanListDtoBuilder() {
    AdminScanListDto._defaults(this);
  }

  AdminScanListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminScanListDto other) {
    _$v = other as _$AdminScanListDto;
  }

  @override
  void update(void Function(AdminScanListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminScanListDto build() => _build();

  _$AdminScanListDto _build() {
    _$AdminScanListDto _$result;
    try {
      _$result = _$v ?? _$AdminScanListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminScanListDto',
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

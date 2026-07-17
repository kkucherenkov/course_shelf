// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_library_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminLibraryListDto extends AdminLibraryListDto {
  @override
  final BuiltList<AdminLibraryListItem> items;

  factory _$AdminLibraryListDto([
    void Function(AdminLibraryListDtoBuilder)? updates,
  ]) => (AdminLibraryListDtoBuilder()..update(updates))._build();

  _$AdminLibraryListDto._({required this.items}) : super._();
  @override
  AdminLibraryListDto rebuild(
    void Function(AdminLibraryListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminLibraryListDtoBuilder toBuilder() =>
      AdminLibraryListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminLibraryListDto && items == other.items;
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
      r'AdminLibraryListDto',
    )..add('items', items)).toString();
  }
}

class AdminLibraryListDtoBuilder
    implements Builder<AdminLibraryListDto, AdminLibraryListDtoBuilder> {
  _$AdminLibraryListDto? _$v;

  ListBuilder<AdminLibraryListItem>? _items;
  ListBuilder<AdminLibraryListItem> get items =>
      _$this._items ??= ListBuilder<AdminLibraryListItem>();
  set items(ListBuilder<AdminLibraryListItem>? items) => _$this._items = items;

  AdminLibraryListDtoBuilder() {
    AdminLibraryListDto._defaults(this);
  }

  AdminLibraryListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminLibraryListDto other) {
    _$v = other as _$AdminLibraryListDto;
  }

  @override
  void update(void Function(AdminLibraryListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminLibraryListDto build() => _build();

  _$AdminLibraryListDto _build() {
    _$AdminLibraryListDto _$result;
    try {
      _$result = _$v ?? _$AdminLibraryListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminLibraryListDto',
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

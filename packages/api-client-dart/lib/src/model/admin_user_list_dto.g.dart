// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUserListDto extends AdminUserListDto {
  @override
  final BuiltList<AdminUserListItem> items;

  factory _$AdminUserListDto([
    void Function(AdminUserListDtoBuilder)? updates,
  ]) => (AdminUserListDtoBuilder()..update(updates))._build();

  _$AdminUserListDto._({required this.items}) : super._();
  @override
  AdminUserListDto rebuild(void Function(AdminUserListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserListDtoBuilder toBuilder() =>
      AdminUserListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserListDto && items == other.items;
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
      r'AdminUserListDto',
    )..add('items', items)).toString();
  }
}

class AdminUserListDtoBuilder
    implements Builder<AdminUserListDto, AdminUserListDtoBuilder> {
  _$AdminUserListDto? _$v;

  ListBuilder<AdminUserListItem>? _items;
  ListBuilder<AdminUserListItem> get items =>
      _$this._items ??= ListBuilder<AdminUserListItem>();
  set items(ListBuilder<AdminUserListItem>? items) => _$this._items = items;

  AdminUserListDtoBuilder() {
    AdminUserListDto._defaults(this);
  }

  AdminUserListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserListDto other) {
    _$v = other as _$AdminUserListDto;
  }

  @override
  void update(void Function(AdminUserListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserListDto build() => _build();

  _$AdminUserListDto _build() {
    _$AdminUserListDto _$result;
    try {
      _$result = _$v ?? _$AdminUserListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminUserListDto',
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

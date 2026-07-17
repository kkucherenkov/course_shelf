// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseListDto extends CourseListDto {
  @override
  final BuiltList<CourseDto> items;

  factory _$CourseListDto([void Function(CourseListDtoBuilder)? updates]) =>
      (CourseListDtoBuilder()..update(updates))._build();

  _$CourseListDto._({required this.items}) : super._();
  @override
  CourseListDto rebuild(void Function(CourseListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CourseListDtoBuilder toBuilder() => CourseListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseListDto && items == other.items;
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
      r'CourseListDto',
    )..add('items', items)).toString();
  }
}

class CourseListDtoBuilder
    implements Builder<CourseListDto, CourseListDtoBuilder> {
  _$CourseListDto? _$v;

  ListBuilder<CourseDto>? _items;
  ListBuilder<CourseDto> get items =>
      _$this._items ??= ListBuilder<CourseDto>();
  set items(ListBuilder<CourseDto>? items) => _$this._items = items;

  CourseListDtoBuilder() {
    CourseListDto._defaults(this);
  }

  CourseListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseListDto other) {
    _$v = other as _$CourseListDto;
  }

  @override
  void update(void Function(CourseListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseListDto build() => _build();

  _$CourseListDto _build() {
    _$CourseListDto _$result;
    try {
      _$result = _$v ?? _$CourseListDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CourseListDto',
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

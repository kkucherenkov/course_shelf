// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'section_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SectionDto extends SectionDto {
  @override
  final String id;
  @override
  final int position;
  @override
  final String title;

  factory _$SectionDto([void Function(SectionDtoBuilder)? updates]) =>
      (SectionDtoBuilder()..update(updates))._build();

  _$SectionDto._({
    required this.id,
    required this.position,
    required this.title,
  }) : super._();
  @override
  SectionDto rebuild(void Function(SectionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SectionDtoBuilder toBuilder() => SectionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SectionDto &&
        id == other.id &&
        position == other.position &&
        title == other.title;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SectionDto')
          ..add('id', id)
          ..add('position', position)
          ..add('title', title))
        .toString();
  }
}

class SectionDtoBuilder implements Builder<SectionDto, SectionDtoBuilder> {
  _$SectionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  SectionDtoBuilder() {
    SectionDto._defaults(this);
  }

  SectionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _position = $v.position;
      _title = $v.title;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SectionDto other) {
    _$v = other as _$SectionDto;
  }

  @override
  void update(void Function(SectionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SectionDto build() => _build();

  _$SectionDto _build() {
    final _$result =
        _$v ??
        _$SectionDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'SectionDto', 'id'),
          position: BuiltValueNullFieldError.checkNotNull(
            position,
            r'SectionDto',
            'position',
          ),
          title: BuiltValueNullFieldError.checkNotNull(
            title,
            r'SectionDto',
            'title',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

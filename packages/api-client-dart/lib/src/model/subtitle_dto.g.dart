// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subtitle_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SubtitleDto extends SubtitleDto {
  @override
  final String id;
  @override
  final String language;
  @override
  final String label;
  @override
  final bool? generated;

  factory _$SubtitleDto([void Function(SubtitleDtoBuilder)? updates]) =>
      (SubtitleDtoBuilder()..update(updates))._build();

  _$SubtitleDto._({
    required this.id,
    required this.language,
    required this.label,
    this.generated,
  }) : super._();
  @override
  SubtitleDto rebuild(void Function(SubtitleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SubtitleDtoBuilder toBuilder() => SubtitleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SubtitleDto &&
        id == other.id &&
        language == other.language &&
        label == other.label &&
        generated == other.generated;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, generated.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SubtitleDto')
          ..add('id', id)
          ..add('language', language)
          ..add('label', label)
          ..add('generated', generated))
        .toString();
  }
}

class SubtitleDtoBuilder implements Builder<SubtitleDto, SubtitleDtoBuilder> {
  _$SubtitleDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _language;
  String? get language => _$this._language;
  set language(String? language) => _$this._language = language;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  bool? _generated;
  bool? get generated => _$this._generated;
  set generated(bool? generated) => _$this._generated = generated;

  SubtitleDtoBuilder() {
    SubtitleDto._defaults(this);
  }

  SubtitleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _language = $v.language;
      _label = $v.label;
      _generated = $v.generated;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SubtitleDto other) {
    _$v = other as _$SubtitleDto;
  }

  @override
  void update(void Function(SubtitleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SubtitleDto build() => _build();

  _$SubtitleDto _build() {
    final _$result =
        _$v ??
        _$SubtitleDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'SubtitleDto', 'id'),
          language: BuiltValueNullFieldError.checkNotNull(
            language,
            r'SubtitleDto',
            'language',
          ),
          label: BuiltValueNullFieldError.checkNotNull(
            label,
            r'SubtitleDto',
            'label',
          ),
          generated: generated,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

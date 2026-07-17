// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scraper_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScraperListDto extends ScraperListDto {
  @override
  final BuiltList<ScraperInfoDto> scrapers;

  factory _$ScraperListDto([void Function(ScraperListDtoBuilder)? updates]) =>
      (ScraperListDtoBuilder()..update(updates))._build();

  _$ScraperListDto._({required this.scrapers}) : super._();
  @override
  ScraperListDto rebuild(void Function(ScraperListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ScraperListDtoBuilder toBuilder() => ScraperListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScraperListDto && scrapers == other.scrapers;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, scrapers.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'ScraperListDto',
    )..add('scrapers', scrapers)).toString();
  }
}

class ScraperListDtoBuilder
    implements Builder<ScraperListDto, ScraperListDtoBuilder> {
  _$ScraperListDto? _$v;

  ListBuilder<ScraperInfoDto>? _scrapers;
  ListBuilder<ScraperInfoDto> get scrapers =>
      _$this._scrapers ??= ListBuilder<ScraperInfoDto>();
  set scrapers(ListBuilder<ScraperInfoDto>? scrapers) =>
      _$this._scrapers = scrapers;

  ScraperListDtoBuilder() {
    ScraperListDto._defaults(this);
  }

  ScraperListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _scrapers = $v.scrapers.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScraperListDto other) {
    _$v = other as _$ScraperListDto;
  }

  @override
  void update(void Function(ScraperListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScraperListDto build() => _build();

  _$ScraperListDto _build() {
    _$ScraperListDto _$result;
    try {
      _$result = _$v ?? _$ScraperListDto._(scrapers: scrapers.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'scrapers';
        scrapers.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ScraperListDto',
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

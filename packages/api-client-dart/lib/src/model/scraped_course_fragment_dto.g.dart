// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scraped_course_fragment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScrapedCourseFragmentDto extends ScrapedCourseFragmentDto {
  @override
  final String? title;
  @override
  final String? description;
  @override
  final BuiltList<String>? instructorNames;
  @override
  final String? studioName;
  @override
  final BuiltList<String>? tags;
  @override
  final CourseLevel? level;
  @override
  final String? language;
  @override
  final Date? releaseDate;
  @override
  final String? posterUrl;
  @override
  final BuiltList<ExternalIdRef>? externalIds;
  @override
  final double? ratingAverage;
  @override
  final int? ratingCount;

  factory _$ScrapedCourseFragmentDto([
    void Function(ScrapedCourseFragmentDtoBuilder)? updates,
  ]) => (ScrapedCourseFragmentDtoBuilder()..update(updates))._build();

  _$ScrapedCourseFragmentDto._({
    this.title,
    this.description,
    this.instructorNames,
    this.studioName,
    this.tags,
    this.level,
    this.language,
    this.releaseDate,
    this.posterUrl,
    this.externalIds,
    this.ratingAverage,
    this.ratingCount,
  }) : super._();
  @override
  ScrapedCourseFragmentDto rebuild(
    void Function(ScrapedCourseFragmentDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ScrapedCourseFragmentDtoBuilder toBuilder() =>
      ScrapedCourseFragmentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScrapedCourseFragmentDto &&
        title == other.title &&
        description == other.description &&
        instructorNames == other.instructorNames &&
        studioName == other.studioName &&
        tags == other.tags &&
        level == other.level &&
        language == other.language &&
        releaseDate == other.releaseDate &&
        posterUrl == other.posterUrl &&
        externalIds == other.externalIds &&
        ratingAverage == other.ratingAverage &&
        ratingCount == other.ratingCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, instructorNames.hashCode);
    _$hash = $jc(_$hash, studioName.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, releaseDate.hashCode);
    _$hash = $jc(_$hash, posterUrl.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jc(_$hash, ratingAverage.hashCode);
    _$hash = $jc(_$hash, ratingCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ScrapedCourseFragmentDto')
          ..add('title', title)
          ..add('description', description)
          ..add('instructorNames', instructorNames)
          ..add('studioName', studioName)
          ..add('tags', tags)
          ..add('level', level)
          ..add('language', language)
          ..add('releaseDate', releaseDate)
          ..add('posterUrl', posterUrl)
          ..add('externalIds', externalIds)
          ..add('ratingAverage', ratingAverage)
          ..add('ratingCount', ratingCount))
        .toString();
  }
}

class ScrapedCourseFragmentDtoBuilder
    implements
        Builder<ScrapedCourseFragmentDto, ScrapedCourseFragmentDtoBuilder> {
  _$ScrapedCourseFragmentDto? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  ListBuilder<String>? _instructorNames;
  ListBuilder<String> get instructorNames =>
      _$this._instructorNames ??= ListBuilder<String>();
  set instructorNames(ListBuilder<String>? instructorNames) =>
      _$this._instructorNames = instructorNames;

  String? _studioName;
  String? get studioName => _$this._studioName;
  set studioName(String? studioName) => _$this._studioName = studioName;

  ListBuilder<String>? _tags;
  ListBuilder<String> get tags => _$this._tags ??= ListBuilder<String>();
  set tags(ListBuilder<String>? tags) => _$this._tags = tags;

  CourseLevel? _level;
  CourseLevel? get level => _$this._level;
  set level(CourseLevel? level) => _$this._level = level;

  String? _language;
  String? get language => _$this._language;
  set language(String? language) => _$this._language = language;

  Date? _releaseDate;
  Date? get releaseDate => _$this._releaseDate;
  set releaseDate(Date? releaseDate) => _$this._releaseDate = releaseDate;

  String? _posterUrl;
  String? get posterUrl => _$this._posterUrl;
  set posterUrl(String? posterUrl) => _$this._posterUrl = posterUrl;

  ListBuilder<ExternalIdRef>? _externalIds;
  ListBuilder<ExternalIdRef> get externalIds =>
      _$this._externalIds ??= ListBuilder<ExternalIdRef>();
  set externalIds(ListBuilder<ExternalIdRef>? externalIds) =>
      _$this._externalIds = externalIds;

  double? _ratingAverage;
  double? get ratingAverage => _$this._ratingAverage;
  set ratingAverage(double? ratingAverage) =>
      _$this._ratingAverage = ratingAverage;

  int? _ratingCount;
  int? get ratingCount => _$this._ratingCount;
  set ratingCount(int? ratingCount) => _$this._ratingCount = ratingCount;

  ScrapedCourseFragmentDtoBuilder() {
    ScrapedCourseFragmentDto._defaults(this);
  }

  ScrapedCourseFragmentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _instructorNames = $v.instructorNames?.toBuilder();
      _studioName = $v.studioName;
      _tags = $v.tags?.toBuilder();
      _level = $v.level;
      _language = $v.language;
      _releaseDate = $v.releaseDate;
      _posterUrl = $v.posterUrl;
      _externalIds = $v.externalIds?.toBuilder();
      _ratingAverage = $v.ratingAverage;
      _ratingCount = $v.ratingCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScrapedCourseFragmentDto other) {
    _$v = other as _$ScrapedCourseFragmentDto;
  }

  @override
  void update(void Function(ScrapedCourseFragmentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScrapedCourseFragmentDto build() => _build();

  _$ScrapedCourseFragmentDto _build() {
    _$ScrapedCourseFragmentDto _$result;
    try {
      _$result =
          _$v ??
          _$ScrapedCourseFragmentDto._(
            title: title,
            description: description,
            instructorNames: _instructorNames?.build(),
            studioName: studioName,
            tags: _tags?.build(),
            level: level,
            language: language,
            releaseDate: releaseDate,
            posterUrl: posterUrl,
            externalIds: _externalIds?.build(),
            ratingAverage: ratingAverage,
            ratingCount: ratingCount,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'instructorNames';
        _instructorNames?.build();

        _$failedField = 'tags';
        _tags?.build();

        _$failedField = 'externalIds';
        _externalIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ScrapedCourseFragmentDto',
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

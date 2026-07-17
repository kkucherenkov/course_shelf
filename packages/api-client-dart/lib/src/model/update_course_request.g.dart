// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_course_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateCourseRequest extends UpdateCourseRequest {
  @override
  final String? title;
  @override
  final String? description;
  @override
  final String? slug;
  @override
  final BuiltList<String>? instructorIds;
  @override
  final BuiltList<String>? studioIds;
  @override
  final BuiltList<String>? tagIds;
  @override
  final CourseLevel? level;
  @override
  final String? language;
  @override
  final Date? releaseDate;
  @override
  final String? posterUrl;
  @override
  final num? ratingAverage;
  @override
  final int? ratingCount;
  @override
  final BuiltList<ExternalIdRef>? externalIds;
  @override
  final DateTime? sourceUpdatedAt;

  factory _$UpdateCourseRequest([
    void Function(UpdateCourseRequestBuilder)? updates,
  ]) => (UpdateCourseRequestBuilder()..update(updates))._build();

  _$UpdateCourseRequest._({
    this.title,
    this.description,
    this.slug,
    this.instructorIds,
    this.studioIds,
    this.tagIds,
    this.level,
    this.language,
    this.releaseDate,
    this.posterUrl,
    this.ratingAverage,
    this.ratingCount,
    this.externalIds,
    this.sourceUpdatedAt,
  }) : super._();
  @override
  UpdateCourseRequest rebuild(
    void Function(UpdateCourseRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpdateCourseRequestBuilder toBuilder() =>
      UpdateCourseRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateCourseRequest &&
        title == other.title &&
        description == other.description &&
        slug == other.slug &&
        instructorIds == other.instructorIds &&
        studioIds == other.studioIds &&
        tagIds == other.tagIds &&
        level == other.level &&
        language == other.language &&
        releaseDate == other.releaseDate &&
        posterUrl == other.posterUrl &&
        ratingAverage == other.ratingAverage &&
        ratingCount == other.ratingCount &&
        externalIds == other.externalIds &&
        sourceUpdatedAt == other.sourceUpdatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, instructorIds.hashCode);
    _$hash = $jc(_$hash, studioIds.hashCode);
    _$hash = $jc(_$hash, tagIds.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, releaseDate.hashCode);
    _$hash = $jc(_$hash, posterUrl.hashCode);
    _$hash = $jc(_$hash, ratingAverage.hashCode);
    _$hash = $jc(_$hash, ratingCount.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jc(_$hash, sourceUpdatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateCourseRequest')
          ..add('title', title)
          ..add('description', description)
          ..add('slug', slug)
          ..add('instructorIds', instructorIds)
          ..add('studioIds', studioIds)
          ..add('tagIds', tagIds)
          ..add('level', level)
          ..add('language', language)
          ..add('releaseDate', releaseDate)
          ..add('posterUrl', posterUrl)
          ..add('ratingAverage', ratingAverage)
          ..add('ratingCount', ratingCount)
          ..add('externalIds', externalIds)
          ..add('sourceUpdatedAt', sourceUpdatedAt))
        .toString();
  }
}

class UpdateCourseRequestBuilder
    implements Builder<UpdateCourseRequest, UpdateCourseRequestBuilder> {
  _$UpdateCourseRequest? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  ListBuilder<String>? _instructorIds;
  ListBuilder<String> get instructorIds =>
      _$this._instructorIds ??= ListBuilder<String>();
  set instructorIds(ListBuilder<String>? instructorIds) =>
      _$this._instructorIds = instructorIds;

  ListBuilder<String>? _studioIds;
  ListBuilder<String> get studioIds =>
      _$this._studioIds ??= ListBuilder<String>();
  set studioIds(ListBuilder<String>? studioIds) =>
      _$this._studioIds = studioIds;

  ListBuilder<String>? _tagIds;
  ListBuilder<String> get tagIds => _$this._tagIds ??= ListBuilder<String>();
  set tagIds(ListBuilder<String>? tagIds) => _$this._tagIds = tagIds;

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

  num? _ratingAverage;
  num? get ratingAverage => _$this._ratingAverage;
  set ratingAverage(num? ratingAverage) =>
      _$this._ratingAverage = ratingAverage;

  int? _ratingCount;
  int? get ratingCount => _$this._ratingCount;
  set ratingCount(int? ratingCount) => _$this._ratingCount = ratingCount;

  ListBuilder<ExternalIdRef>? _externalIds;
  ListBuilder<ExternalIdRef> get externalIds =>
      _$this._externalIds ??= ListBuilder<ExternalIdRef>();
  set externalIds(ListBuilder<ExternalIdRef>? externalIds) =>
      _$this._externalIds = externalIds;

  DateTime? _sourceUpdatedAt;
  DateTime? get sourceUpdatedAt => _$this._sourceUpdatedAt;
  set sourceUpdatedAt(DateTime? sourceUpdatedAt) =>
      _$this._sourceUpdatedAt = sourceUpdatedAt;

  UpdateCourseRequestBuilder() {
    UpdateCourseRequest._defaults(this);
  }

  UpdateCourseRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _slug = $v.slug;
      _instructorIds = $v.instructorIds?.toBuilder();
      _studioIds = $v.studioIds?.toBuilder();
      _tagIds = $v.tagIds?.toBuilder();
      _level = $v.level;
      _language = $v.language;
      _releaseDate = $v.releaseDate;
      _posterUrl = $v.posterUrl;
      _ratingAverage = $v.ratingAverage;
      _ratingCount = $v.ratingCount;
      _externalIds = $v.externalIds?.toBuilder();
      _sourceUpdatedAt = $v.sourceUpdatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateCourseRequest other) {
    _$v = other as _$UpdateCourseRequest;
  }

  @override
  void update(void Function(UpdateCourseRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateCourseRequest build() => _build();

  _$UpdateCourseRequest _build() {
    _$UpdateCourseRequest _$result;
    try {
      _$result =
          _$v ??
          _$UpdateCourseRequest._(
            title: title,
            description: description,
            slug: slug,
            instructorIds: _instructorIds?.build(),
            studioIds: _studioIds?.build(),
            tagIds: _tagIds?.build(),
            level: level,
            language: language,
            releaseDate: releaseDate,
            posterUrl: posterUrl,
            ratingAverage: ratingAverage,
            ratingCount: ratingCount,
            externalIds: _externalIds?.build(),
            sourceUpdatedAt: sourceUpdatedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'instructorIds';
        _instructorIds?.build();
        _$failedField = 'studioIds';
        _studioIds?.build();
        _$failedField = 'tagIds';
        _tagIds?.build();

        _$failedField = 'externalIds';
        _externalIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UpdateCourseRequest',
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

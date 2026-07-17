// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseDto extends CourseDto {
  @override
  final String id;
  @override
  final String libraryId;
  @override
  final String slug;
  @override
  final String title;
  @override
  final String? description;
  @override
  final BuiltList<SectionDto> sections;
  @override
  final CourseProgress progress;
  @override
  final BuiltList<InstructorRef>? instructors;
  @override
  final BuiltList<StudioRef>? studios;
  @override
  final BuiltList<TagRef>? tags;
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
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$CourseDto([void Function(CourseDtoBuilder)? updates]) =>
      (CourseDtoBuilder()..update(updates))._build();

  _$CourseDto._({
    required this.id,
    required this.libraryId,
    required this.slug,
    required this.title,
    this.description,
    required this.sections,
    required this.progress,
    this.instructors,
    this.studios,
    this.tags,
    this.level,
    this.language,
    this.releaseDate,
    this.posterUrl,
    this.ratingAverage,
    this.ratingCount,
    this.externalIds,
    this.sourceUpdatedAt,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  CourseDto rebuild(void Function(CourseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CourseDtoBuilder toBuilder() => CourseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseDto &&
        id == other.id &&
        libraryId == other.libraryId &&
        slug == other.slug &&
        title == other.title &&
        description == other.description &&
        sections == other.sections &&
        progress == other.progress &&
        instructors == other.instructors &&
        studios == other.studios &&
        tags == other.tags &&
        level == other.level &&
        language == other.language &&
        releaseDate == other.releaseDate &&
        posterUrl == other.posterUrl &&
        ratingAverage == other.ratingAverage &&
        ratingCount == other.ratingCount &&
        externalIds == other.externalIds &&
        sourceUpdatedAt == other.sourceUpdatedAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, sections.hashCode);
    _$hash = $jc(_$hash, progress.hashCode);
    _$hash = $jc(_$hash, instructors.hashCode);
    _$hash = $jc(_$hash, studios.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, releaseDate.hashCode);
    _$hash = $jc(_$hash, posterUrl.hashCode);
    _$hash = $jc(_$hash, ratingAverage.hashCode);
    _$hash = $jc(_$hash, ratingCount.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jc(_$hash, sourceUpdatedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseDto')
          ..add('id', id)
          ..add('libraryId', libraryId)
          ..add('slug', slug)
          ..add('title', title)
          ..add('description', description)
          ..add('sections', sections)
          ..add('progress', progress)
          ..add('instructors', instructors)
          ..add('studios', studios)
          ..add('tags', tags)
          ..add('level', level)
          ..add('language', language)
          ..add('releaseDate', releaseDate)
          ..add('posterUrl', posterUrl)
          ..add('ratingAverage', ratingAverage)
          ..add('ratingCount', ratingCount)
          ..add('externalIds', externalIds)
          ..add('sourceUpdatedAt', sourceUpdatedAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class CourseDtoBuilder implements Builder<CourseDto, CourseDtoBuilder> {
  _$CourseDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  ListBuilder<SectionDto>? _sections;
  ListBuilder<SectionDto> get sections =>
      _$this._sections ??= ListBuilder<SectionDto>();
  set sections(ListBuilder<SectionDto>? sections) =>
      _$this._sections = sections;

  CourseProgressBuilder? _progress;
  CourseProgressBuilder get progress =>
      _$this._progress ??= CourseProgressBuilder();
  set progress(CourseProgressBuilder? progress) => _$this._progress = progress;

  ListBuilder<InstructorRef>? _instructors;
  ListBuilder<InstructorRef> get instructors =>
      _$this._instructors ??= ListBuilder<InstructorRef>();
  set instructors(ListBuilder<InstructorRef>? instructors) =>
      _$this._instructors = instructors;

  ListBuilder<StudioRef>? _studios;
  ListBuilder<StudioRef> get studios =>
      _$this._studios ??= ListBuilder<StudioRef>();
  set studios(ListBuilder<StudioRef>? studios) => _$this._studios = studios;

  ListBuilder<TagRef>? _tags;
  ListBuilder<TagRef> get tags => _$this._tags ??= ListBuilder<TagRef>();
  set tags(ListBuilder<TagRef>? tags) => _$this._tags = tags;

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

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  CourseDtoBuilder() {
    CourseDto._defaults(this);
  }

  CourseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _libraryId = $v.libraryId;
      _slug = $v.slug;
      _title = $v.title;
      _description = $v.description;
      _sections = $v.sections.toBuilder();
      _progress = $v.progress.toBuilder();
      _instructors = $v.instructors?.toBuilder();
      _studios = $v.studios?.toBuilder();
      _tags = $v.tags?.toBuilder();
      _level = $v.level;
      _language = $v.language;
      _releaseDate = $v.releaseDate;
      _posterUrl = $v.posterUrl;
      _ratingAverage = $v.ratingAverage;
      _ratingCount = $v.ratingCount;
      _externalIds = $v.externalIds?.toBuilder();
      _sourceUpdatedAt = $v.sourceUpdatedAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseDto other) {
    _$v = other as _$CourseDto;
  }

  @override
  void update(void Function(CourseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseDto build() => _build();

  _$CourseDto _build() {
    _$CourseDto _$result;
    try {
      _$result =
          _$v ??
          _$CourseDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'CourseDto', 'id'),
            libraryId: BuiltValueNullFieldError.checkNotNull(
              libraryId,
              r'CourseDto',
              'libraryId',
            ),
            slug: BuiltValueNullFieldError.checkNotNull(
              slug,
              r'CourseDto',
              'slug',
            ),
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'CourseDto',
              'title',
            ),
            description: description,
            sections: sections.build(),
            progress: progress.build(),
            instructors: _instructors?.build(),
            studios: _studios?.build(),
            tags: _tags?.build(),
            level: level,
            language: language,
            releaseDate: releaseDate,
            posterUrl: posterUrl,
            ratingAverage: ratingAverage,
            ratingCount: ratingCount,
            externalIds: _externalIds?.build(),
            sourceUpdatedAt: sourceUpdatedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'CourseDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'CourseDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'sections';
        sections.build();
        _$failedField = 'progress';
        progress.build();
        _$failedField = 'instructors';
        _instructors?.build();
        _$failedField = 'studios';
        _studios?.build();
        _$failedField = 'tags';
        _tags?.build();

        _$failedField = 'externalIds';
        _externalIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CourseDto',
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

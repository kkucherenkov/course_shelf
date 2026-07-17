// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'merge_policy_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MergePolicyDto extends MergePolicyDto {
  @override
  final MergeMode? title;
  @override
  final MergeMode? description;
  @override
  final MergeMode? level;
  @override
  final MergeMode? language;
  @override
  final MergeMode? posterUrl;
  @override
  final MergeMode? releaseDate;
  @override
  final MergeMode? ratingAverage;
  @override
  final MergeMode? ratingCount;
  @override
  final MergeMode? instructors;
  @override
  final MergeMode? studios;
  @override
  final MergeMode? tags;
  @override
  final MergeMode? externalIds;

  factory _$MergePolicyDto([void Function(MergePolicyDtoBuilder)? updates]) =>
      (MergePolicyDtoBuilder()..update(updates))._build();

  _$MergePolicyDto._({
    this.title,
    this.description,
    this.level,
    this.language,
    this.posterUrl,
    this.releaseDate,
    this.ratingAverage,
    this.ratingCount,
    this.instructors,
    this.studios,
    this.tags,
    this.externalIds,
  }) : super._();
  @override
  MergePolicyDto rebuild(void Function(MergePolicyDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MergePolicyDtoBuilder toBuilder() => MergePolicyDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MergePolicyDto &&
        title == other.title &&
        description == other.description &&
        level == other.level &&
        language == other.language &&
        posterUrl == other.posterUrl &&
        releaseDate == other.releaseDate &&
        ratingAverage == other.ratingAverage &&
        ratingCount == other.ratingCount &&
        instructors == other.instructors &&
        studios == other.studios &&
        tags == other.tags &&
        externalIds == other.externalIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, level.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, posterUrl.hashCode);
    _$hash = $jc(_$hash, releaseDate.hashCode);
    _$hash = $jc(_$hash, ratingAverage.hashCode);
    _$hash = $jc(_$hash, ratingCount.hashCode);
    _$hash = $jc(_$hash, instructors.hashCode);
    _$hash = $jc(_$hash, studios.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MergePolicyDto')
          ..add('title', title)
          ..add('description', description)
          ..add('level', level)
          ..add('language', language)
          ..add('posterUrl', posterUrl)
          ..add('releaseDate', releaseDate)
          ..add('ratingAverage', ratingAverage)
          ..add('ratingCount', ratingCount)
          ..add('instructors', instructors)
          ..add('studios', studios)
          ..add('tags', tags)
          ..add('externalIds', externalIds))
        .toString();
  }
}

class MergePolicyDtoBuilder
    implements Builder<MergePolicyDto, MergePolicyDtoBuilder> {
  _$MergePolicyDto? _$v;

  MergeMode? _title;
  MergeMode? get title => _$this._title;
  set title(MergeMode? title) => _$this._title = title;

  MergeMode? _description;
  MergeMode? get description => _$this._description;
  set description(MergeMode? description) => _$this._description = description;

  MergeMode? _level;
  MergeMode? get level => _$this._level;
  set level(MergeMode? level) => _$this._level = level;

  MergeMode? _language;
  MergeMode? get language => _$this._language;
  set language(MergeMode? language) => _$this._language = language;

  MergeMode? _posterUrl;
  MergeMode? get posterUrl => _$this._posterUrl;
  set posterUrl(MergeMode? posterUrl) => _$this._posterUrl = posterUrl;

  MergeMode? _releaseDate;
  MergeMode? get releaseDate => _$this._releaseDate;
  set releaseDate(MergeMode? releaseDate) => _$this._releaseDate = releaseDate;

  MergeMode? _ratingAverage;
  MergeMode? get ratingAverage => _$this._ratingAverage;
  set ratingAverage(MergeMode? ratingAverage) =>
      _$this._ratingAverage = ratingAverage;

  MergeMode? _ratingCount;
  MergeMode? get ratingCount => _$this._ratingCount;
  set ratingCount(MergeMode? ratingCount) => _$this._ratingCount = ratingCount;

  MergeMode? _instructors;
  MergeMode? get instructors => _$this._instructors;
  set instructors(MergeMode? instructors) => _$this._instructors = instructors;

  MergeMode? _studios;
  MergeMode? get studios => _$this._studios;
  set studios(MergeMode? studios) => _$this._studios = studios;

  MergeMode? _tags;
  MergeMode? get tags => _$this._tags;
  set tags(MergeMode? tags) => _$this._tags = tags;

  MergeMode? _externalIds;
  MergeMode? get externalIds => _$this._externalIds;
  set externalIds(MergeMode? externalIds) => _$this._externalIds = externalIds;

  MergePolicyDtoBuilder() {
    MergePolicyDto._defaults(this);
  }

  MergePolicyDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _level = $v.level;
      _language = $v.language;
      _posterUrl = $v.posterUrl;
      _releaseDate = $v.releaseDate;
      _ratingAverage = $v.ratingAverage;
      _ratingCount = $v.ratingCount;
      _instructors = $v.instructors;
      _studios = $v.studios;
      _tags = $v.tags;
      _externalIds = $v.externalIds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MergePolicyDto other) {
    _$v = other as _$MergePolicyDto;
  }

  @override
  void update(void Function(MergePolicyDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MergePolicyDto build() => _build();

  _$MergePolicyDto _build() {
    final _$result =
        _$v ??
        _$MergePolicyDto._(
          title: title,
          description: description,
          level: level,
          language: language,
          posterUrl: posterUrl,
          releaseDate: releaseDate,
          ratingAverage: ratingAverage,
          ratingCount: ratingCount,
          instructors: instructors,
          studios: studios,
          tags: tags,
          externalIds: externalIds,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

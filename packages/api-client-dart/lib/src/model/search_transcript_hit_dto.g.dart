// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_transcript_hit_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SearchTranscriptHitDto extends SearchTranscriptHitDto {
  @override
  final String lessonId;
  @override
  final String lessonTitle;
  @override
  final String courseId;
  @override
  final String courseTitle;
  @override
  final String sectionTitle;
  @override
  final String language;
  @override
  final int startMs;
  @override
  final String text;

  factory _$SearchTranscriptHitDto([
    void Function(SearchTranscriptHitDtoBuilder)? updates,
  ]) => (SearchTranscriptHitDtoBuilder()..update(updates))._build();

  _$SearchTranscriptHitDto._({
    required this.lessonId,
    required this.lessonTitle,
    required this.courseId,
    required this.courseTitle,
    required this.sectionTitle,
    required this.language,
    required this.startMs,
    required this.text,
  }) : super._();
  @override
  SearchTranscriptHitDto rebuild(
    void Function(SearchTranscriptHitDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  SearchTranscriptHitDtoBuilder toBuilder() =>
      SearchTranscriptHitDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SearchTranscriptHitDto &&
        lessonId == other.lessonId &&
        lessonTitle == other.lessonTitle &&
        courseId == other.courseId &&
        courseTitle == other.courseTitle &&
        sectionTitle == other.sectionTitle &&
        language == other.language &&
        startMs == other.startMs &&
        text == other.text;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, lessonTitle.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, courseTitle.hashCode);
    _$hash = $jc(_$hash, sectionTitle.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, startMs.hashCode);
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SearchTranscriptHitDto')
          ..add('lessonId', lessonId)
          ..add('lessonTitle', lessonTitle)
          ..add('courseId', courseId)
          ..add('courseTitle', courseTitle)
          ..add('sectionTitle', sectionTitle)
          ..add('language', language)
          ..add('startMs', startMs)
          ..add('text', text))
        .toString();
  }
}

class SearchTranscriptHitDtoBuilder
    implements Builder<SearchTranscriptHitDto, SearchTranscriptHitDtoBuilder> {
  _$SearchTranscriptHitDto? _$v;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _lessonTitle;
  String? get lessonTitle => _$this._lessonTitle;
  set lessonTitle(String? lessonTitle) => _$this._lessonTitle = lessonTitle;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _courseTitle;
  String? get courseTitle => _$this._courseTitle;
  set courseTitle(String? courseTitle) => _$this._courseTitle = courseTitle;

  String? _sectionTitle;
  String? get sectionTitle => _$this._sectionTitle;
  set sectionTitle(String? sectionTitle) => _$this._sectionTitle = sectionTitle;

  String? _language;
  String? get language => _$this._language;
  set language(String? language) => _$this._language = language;

  int? _startMs;
  int? get startMs => _$this._startMs;
  set startMs(int? startMs) => _$this._startMs = startMs;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  SearchTranscriptHitDtoBuilder() {
    SearchTranscriptHitDto._defaults(this);
  }

  SearchTranscriptHitDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lessonId = $v.lessonId;
      _lessonTitle = $v.lessonTitle;
      _courseId = $v.courseId;
      _courseTitle = $v.courseTitle;
      _sectionTitle = $v.sectionTitle;
      _language = $v.language;
      _startMs = $v.startMs;
      _text = $v.text;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SearchTranscriptHitDto other) {
    _$v = other as _$SearchTranscriptHitDto;
  }

  @override
  void update(void Function(SearchTranscriptHitDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SearchTranscriptHitDto build() => _build();

  _$SearchTranscriptHitDto _build() {
    final _$result =
        _$v ??
        _$SearchTranscriptHitDto._(
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'SearchTranscriptHitDto',
            'lessonId',
          ),
          lessonTitle: BuiltValueNullFieldError.checkNotNull(
            lessonTitle,
            r'SearchTranscriptHitDto',
            'lessonTitle',
          ),
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'SearchTranscriptHitDto',
            'courseId',
          ),
          courseTitle: BuiltValueNullFieldError.checkNotNull(
            courseTitle,
            r'SearchTranscriptHitDto',
            'courseTitle',
          ),
          sectionTitle: BuiltValueNullFieldError.checkNotNull(
            sectionTitle,
            r'SearchTranscriptHitDto',
            'sectionTitle',
          ),
          language: BuiltValueNullFieldError.checkNotNull(
            language,
            r'SearchTranscriptHitDto',
            'language',
          ),
          startMs: BuiltValueNullFieldError.checkNotNull(
            startMs,
            r'SearchTranscriptHitDto',
            'startMs',
          ),
          text: BuiltValueNullFieldError.checkNotNull(
            text,
            r'SearchTranscriptHitDto',
            'text',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

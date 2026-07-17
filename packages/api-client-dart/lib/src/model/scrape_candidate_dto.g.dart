// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scrape_candidate_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScrapeCandidateDto extends ScrapeCandidateDto {
  @override
  final String source_;
  @override
  final String? sourceUrl;
  @override
  final double? confidence;
  @override
  final ScrapedCourseFragmentDto fragment;

  factory _$ScrapeCandidateDto([
    void Function(ScrapeCandidateDtoBuilder)? updates,
  ]) => (ScrapeCandidateDtoBuilder()..update(updates))._build();

  _$ScrapeCandidateDto._({
    required this.source_,
    this.sourceUrl,
    this.confidence,
    required this.fragment,
  }) : super._();
  @override
  ScrapeCandidateDto rebuild(
    void Function(ScrapeCandidateDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ScrapeCandidateDtoBuilder toBuilder() =>
      ScrapeCandidateDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScrapeCandidateDto &&
        source_ == other.source_ &&
        sourceUrl == other.sourceUrl &&
        confidence == other.confidence &&
        fragment == other.fragment;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceUrl.hashCode);
    _$hash = $jc(_$hash, confidence.hashCode);
    _$hash = $jc(_$hash, fragment.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ScrapeCandidateDto')
          ..add('source_', source_)
          ..add('sourceUrl', sourceUrl)
          ..add('confidence', confidence)
          ..add('fragment', fragment))
        .toString();
  }
}

class ScrapeCandidateDtoBuilder
    implements Builder<ScrapeCandidateDto, ScrapeCandidateDtoBuilder> {
  _$ScrapeCandidateDto? _$v;

  String? _source_;
  String? get source_ => _$this._source_;
  set source_(String? source_) => _$this._source_ = source_;

  String? _sourceUrl;
  String? get sourceUrl => _$this._sourceUrl;
  set sourceUrl(String? sourceUrl) => _$this._sourceUrl = sourceUrl;

  double? _confidence;
  double? get confidence => _$this._confidence;
  set confidence(double? confidence) => _$this._confidence = confidence;

  ScrapedCourseFragmentDtoBuilder? _fragment;
  ScrapedCourseFragmentDtoBuilder get fragment =>
      _$this._fragment ??= ScrapedCourseFragmentDtoBuilder();
  set fragment(ScrapedCourseFragmentDtoBuilder? fragment) =>
      _$this._fragment = fragment;

  ScrapeCandidateDtoBuilder() {
    ScrapeCandidateDto._defaults(this);
  }

  ScrapeCandidateDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _sourceUrl = $v.sourceUrl;
      _confidence = $v.confidence;
      _fragment = $v.fragment.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScrapeCandidateDto other) {
    _$v = other as _$ScrapeCandidateDto;
  }

  @override
  void update(void Function(ScrapeCandidateDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScrapeCandidateDto build() => _build();

  _$ScrapeCandidateDto _build() {
    _$ScrapeCandidateDto _$result;
    try {
      _$result =
          _$v ??
          _$ScrapeCandidateDto._(
            source_: BuiltValueNullFieldError.checkNotNull(
              source_,
              r'ScrapeCandidateDto',
              'source_',
            ),
            sourceUrl: sourceUrl,
            confidence: confidence,
            fragment: fragment.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fragment';
        fragment.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ScrapeCandidateDto',
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

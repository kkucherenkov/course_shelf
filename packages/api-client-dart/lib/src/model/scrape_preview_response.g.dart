// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scrape_preview_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScrapePreviewResponse extends ScrapePreviewResponse {
  @override
  final BuiltList<ScrapeCandidateDto> candidates;

  factory _$ScrapePreviewResponse([
    void Function(ScrapePreviewResponseBuilder)? updates,
  ]) => (ScrapePreviewResponseBuilder()..update(updates))._build();

  _$ScrapePreviewResponse._({required this.candidates}) : super._();
  @override
  ScrapePreviewResponse rebuild(
    void Function(ScrapePreviewResponseBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ScrapePreviewResponseBuilder toBuilder() =>
      ScrapePreviewResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScrapePreviewResponse && candidates == other.candidates;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, candidates.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'ScrapePreviewResponse',
    )..add('candidates', candidates)).toString();
  }
}

class ScrapePreviewResponseBuilder
    implements Builder<ScrapePreviewResponse, ScrapePreviewResponseBuilder> {
  _$ScrapePreviewResponse? _$v;

  ListBuilder<ScrapeCandidateDto>? _candidates;
  ListBuilder<ScrapeCandidateDto> get candidates =>
      _$this._candidates ??= ListBuilder<ScrapeCandidateDto>();
  set candidates(ListBuilder<ScrapeCandidateDto>? candidates) =>
      _$this._candidates = candidates;

  ScrapePreviewResponseBuilder() {
    ScrapePreviewResponse._defaults(this);
  }

  ScrapePreviewResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _candidates = $v.candidates.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScrapePreviewResponse other) {
    _$v = other as _$ScrapePreviewResponse;
  }

  @override
  void update(void Function(ScrapePreviewResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScrapePreviewResponse build() => _build();

  _$ScrapePreviewResponse _build() {
    _$ScrapePreviewResponse _$result;
    try {
      _$result =
          _$v ?? _$ScrapePreviewResponse._(candidates: candidates.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'candidates';
        candidates.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ScrapePreviewResponse',
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

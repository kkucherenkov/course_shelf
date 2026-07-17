// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scrape_preview_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScrapePreviewRequest extends ScrapePreviewRequest {
  @override
  final String? source_;
  @override
  final ScraperKind kind;
  @override
  final String? url;
  @override
  final String? query;
  @override
  final String? fragment;

  factory _$ScrapePreviewRequest([
    void Function(ScrapePreviewRequestBuilder)? updates,
  ]) => (ScrapePreviewRequestBuilder()..update(updates))._build();

  _$ScrapePreviewRequest._({
    this.source_,
    required this.kind,
    this.url,
    this.query,
    this.fragment,
  }) : super._();
  @override
  ScrapePreviewRequest rebuild(
    void Function(ScrapePreviewRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ScrapePreviewRequestBuilder toBuilder() =>
      ScrapePreviewRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScrapePreviewRequest &&
        source_ == other.source_ &&
        kind == other.kind &&
        url == other.url &&
        query == other.query &&
        fragment == other.fragment;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, query.hashCode);
    _$hash = $jc(_$hash, fragment.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ScrapePreviewRequest')
          ..add('source_', source_)
          ..add('kind', kind)
          ..add('url', url)
          ..add('query', query)
          ..add('fragment', fragment))
        .toString();
  }
}

class ScrapePreviewRequestBuilder
    implements Builder<ScrapePreviewRequest, ScrapePreviewRequestBuilder> {
  _$ScrapePreviewRequest? _$v;

  String? _source_;
  String? get source_ => _$this._source_;
  set source_(String? source_) => _$this._source_ = source_;

  ScraperKind? _kind;
  ScraperKind? get kind => _$this._kind;
  set kind(ScraperKind? kind) => _$this._kind = kind;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _query;
  String? get query => _$this._query;
  set query(String? query) => _$this._query = query;

  String? _fragment;
  String? get fragment => _$this._fragment;
  set fragment(String? fragment) => _$this._fragment = fragment;

  ScrapePreviewRequestBuilder() {
    ScrapePreviewRequest._defaults(this);
  }

  ScrapePreviewRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _kind = $v.kind;
      _url = $v.url;
      _query = $v.query;
      _fragment = $v.fragment;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScrapePreviewRequest other) {
    _$v = other as _$ScrapePreviewRequest;
  }

  @override
  void update(void Function(ScrapePreviewRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScrapePreviewRequest build() => _build();

  _$ScrapePreviewRequest _build() {
    final _$result =
        _$v ??
        _$ScrapePreviewRequest._(
          source_: source_,
          kind: BuiltValueNullFieldError.checkNotNull(
            kind,
            r'ScrapePreviewRequest',
            'kind',
          ),
          url: url,
          query: query,
          fragment: fragment,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

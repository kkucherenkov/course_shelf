// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'external_id_ref.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExternalIdRef extends ExternalIdRef {
  @override
  final String source_;
  @override
  final String externalId;
  @override
  final String? url;

  factory _$ExternalIdRef([void Function(ExternalIdRefBuilder)? updates]) =>
      (ExternalIdRefBuilder()..update(updates))._build();

  _$ExternalIdRef._({required this.source_, required this.externalId, this.url})
    : super._();
  @override
  ExternalIdRef rebuild(void Function(ExternalIdRefBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExternalIdRefBuilder toBuilder() => ExternalIdRefBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExternalIdRef &&
        source_ == other.source_ &&
        externalId == other.externalId &&
        url == other.url;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, externalId.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExternalIdRef')
          ..add('source_', source_)
          ..add('externalId', externalId)
          ..add('url', url))
        .toString();
  }
}

class ExternalIdRefBuilder
    implements Builder<ExternalIdRef, ExternalIdRefBuilder> {
  _$ExternalIdRef? _$v;

  String? _source_;
  String? get source_ => _$this._source_;
  set source_(String? source_) => _$this._source_ = source_;

  String? _externalId;
  String? get externalId => _$this._externalId;
  set externalId(String? externalId) => _$this._externalId = externalId;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  ExternalIdRefBuilder() {
    ExternalIdRef._defaults(this);
  }

  ExternalIdRefBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _externalId = $v.externalId;
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExternalIdRef other) {
    _$v = other as _$ExternalIdRef;
  }

  @override
  void update(void Function(ExternalIdRefBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExternalIdRef build() => _build();

  _$ExternalIdRef _build() {
    final _$result =
        _$v ??
        _$ExternalIdRef._(
          source_: BuiltValueNullFieldError.checkNotNull(
            source_,
            r'ExternalIdRef',
            'source_',
          ),
          externalId: BuiltValueNullFieldError.checkNotNull(
            externalId,
            r'ExternalIdRef',
            'externalId',
          ),
          url: url,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

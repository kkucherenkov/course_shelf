// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'run_identify_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RunIdentifyRequest extends RunIdentifyRequest {
  @override
  final ScrapedCourseFragmentDto fragment;
  @override
  final String source_;
  @override
  final String? sourceUrl;
  @override
  final MergePolicyDto? mergePolicy;

  factory _$RunIdentifyRequest([
    void Function(RunIdentifyRequestBuilder)? updates,
  ]) => (RunIdentifyRequestBuilder()..update(updates))._build();

  _$RunIdentifyRequest._({
    required this.fragment,
    required this.source_,
    this.sourceUrl,
    this.mergePolicy,
  }) : super._();
  @override
  RunIdentifyRequest rebuild(
    void Function(RunIdentifyRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RunIdentifyRequestBuilder toBuilder() =>
      RunIdentifyRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RunIdentifyRequest &&
        fragment == other.fragment &&
        source_ == other.source_ &&
        sourceUrl == other.sourceUrl &&
        mergePolicy == other.mergePolicy;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fragment.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceUrl.hashCode);
    _$hash = $jc(_$hash, mergePolicy.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RunIdentifyRequest')
          ..add('fragment', fragment)
          ..add('source_', source_)
          ..add('sourceUrl', sourceUrl)
          ..add('mergePolicy', mergePolicy))
        .toString();
  }
}

class RunIdentifyRequestBuilder
    implements Builder<RunIdentifyRequest, RunIdentifyRequestBuilder> {
  _$RunIdentifyRequest? _$v;

  ScrapedCourseFragmentDtoBuilder? _fragment;
  ScrapedCourseFragmentDtoBuilder get fragment =>
      _$this._fragment ??= ScrapedCourseFragmentDtoBuilder();
  set fragment(ScrapedCourseFragmentDtoBuilder? fragment) =>
      _$this._fragment = fragment;

  String? _source_;
  String? get source_ => _$this._source_;
  set source_(String? source_) => _$this._source_ = source_;

  String? _sourceUrl;
  String? get sourceUrl => _$this._sourceUrl;
  set sourceUrl(String? sourceUrl) => _$this._sourceUrl = sourceUrl;

  MergePolicyDtoBuilder? _mergePolicy;
  MergePolicyDtoBuilder get mergePolicy =>
      _$this._mergePolicy ??= MergePolicyDtoBuilder();
  set mergePolicy(MergePolicyDtoBuilder? mergePolicy) =>
      _$this._mergePolicy = mergePolicy;

  RunIdentifyRequestBuilder() {
    RunIdentifyRequest._defaults(this);
  }

  RunIdentifyRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fragment = $v.fragment.toBuilder();
      _source_ = $v.source_;
      _sourceUrl = $v.sourceUrl;
      _mergePolicy = $v.mergePolicy?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RunIdentifyRequest other) {
    _$v = other as _$RunIdentifyRequest;
  }

  @override
  void update(void Function(RunIdentifyRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RunIdentifyRequest build() => _build();

  _$RunIdentifyRequest _build() {
    _$RunIdentifyRequest _$result;
    try {
      _$result =
          _$v ??
          _$RunIdentifyRequest._(
            fragment: fragment.build(),
            source_: BuiltValueNullFieldError.checkNotNull(
              source_,
              r'RunIdentifyRequest',
              'source_',
            ),
            sourceUrl: sourceUrl,
            mergePolicy: _mergePolicy?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fragment';
        fragment.build();

        _$failedField = 'mergePolicy';
        _mergePolicy?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'RunIdentifyRequest',
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

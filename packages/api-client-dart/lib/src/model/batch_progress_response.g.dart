// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BatchProgressResponse extends BatchProgressResponse {
  @override
  final BuiltList<BatchProgressItemResult> results;

  factory _$BatchProgressResponse([
    void Function(BatchProgressResponseBuilder)? updates,
  ]) => (BatchProgressResponseBuilder()..update(updates))._build();

  _$BatchProgressResponse._({required this.results}) : super._();
  @override
  BatchProgressResponse rebuild(
    void Function(BatchProgressResponseBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressResponseBuilder toBuilder() =>
      BatchProgressResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressResponse && results == other.results;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, results.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BatchProgressResponse',
    )..add('results', results)).toString();
  }
}

class BatchProgressResponseBuilder
    implements Builder<BatchProgressResponse, BatchProgressResponseBuilder> {
  _$BatchProgressResponse? _$v;

  ListBuilder<BatchProgressItemResult>? _results;
  ListBuilder<BatchProgressItemResult> get results =>
      _$this._results ??= ListBuilder<BatchProgressItemResult>();
  set results(ListBuilder<BatchProgressItemResult>? results) =>
      _$this._results = results;

  BatchProgressResponseBuilder() {
    BatchProgressResponse._defaults(this);
  }

  BatchProgressResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _results = $v.results.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressResponse other) {
    _$v = other as _$BatchProgressResponse;
  }

  @override
  void update(void Function(BatchProgressResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressResponse build() => _build();

  _$BatchProgressResponse _build() {
    _$BatchProgressResponse _$result;
    try {
      _$result = _$v ?? _$BatchProgressResponse._(results: results.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'results';
        results.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BatchProgressResponse',
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

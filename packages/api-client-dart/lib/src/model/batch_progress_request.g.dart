// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'batch_progress_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BatchProgressRequest extends BatchProgressRequest {
  @override
  final BuiltList<RecordProgressRequest> items;

  factory _$BatchProgressRequest([
    void Function(BatchProgressRequestBuilder)? updates,
  ]) => (BatchProgressRequestBuilder()..update(updates))._build();

  _$BatchProgressRequest._({required this.items}) : super._();
  @override
  BatchProgressRequest rebuild(
    void Function(BatchProgressRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BatchProgressRequestBuilder toBuilder() =>
      BatchProgressRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchProgressRequest && items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BatchProgressRequest',
    )..add('items', items)).toString();
  }
}

class BatchProgressRequestBuilder
    implements Builder<BatchProgressRequest, BatchProgressRequestBuilder> {
  _$BatchProgressRequest? _$v;

  ListBuilder<RecordProgressRequest>? _items;
  ListBuilder<RecordProgressRequest> get items =>
      _$this._items ??= ListBuilder<RecordProgressRequest>();
  set items(ListBuilder<RecordProgressRequest>? items) => _$this._items = items;

  BatchProgressRequestBuilder() {
    BatchProgressRequest._defaults(this);
  }

  BatchProgressRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchProgressRequest other) {
    _$v = other as _$BatchProgressRequest;
  }

  @override
  void update(void Function(BatchProgressRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchProgressRequest build() => _build();

  _$BatchProgressRequest _build() {
    _$BatchProgressRequest _$result;
    try {
      _$result = _$v ?? _$BatchProgressRequest._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BatchProgressRequest',
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

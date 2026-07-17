// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'backfill_metadata_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BackfillMetadataRequest extends BackfillMetadataRequest {
  @override
  final String? libraryId;

  factory _$BackfillMetadataRequest([
    void Function(BackfillMetadataRequestBuilder)? updates,
  ]) => (BackfillMetadataRequestBuilder()..update(updates))._build();

  _$BackfillMetadataRequest._({this.libraryId}) : super._();
  @override
  BackfillMetadataRequest rebuild(
    void Function(BackfillMetadataRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BackfillMetadataRequestBuilder toBuilder() =>
      BackfillMetadataRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BackfillMetadataRequest && libraryId == other.libraryId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BackfillMetadataRequest',
    )..add('libraryId', libraryId)).toString();
  }
}

class BackfillMetadataRequestBuilder
    implements
        Builder<BackfillMetadataRequest, BackfillMetadataRequestBuilder> {
  _$BackfillMetadataRequest? _$v;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  BackfillMetadataRequestBuilder() {
    BackfillMetadataRequest._defaults(this);
  }

  BackfillMetadataRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _libraryId = $v.libraryId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BackfillMetadataRequest other) {
    _$v = other as _$BackfillMetadataRequest;
  }

  @override
  void update(void Function(BackfillMetadataRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BackfillMetadataRequest build() => _build();

  _$BackfillMetadataRequest _build() {
    final _$result = _$v ?? _$BackfillMetadataRequest._(libraryId: libraryId);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

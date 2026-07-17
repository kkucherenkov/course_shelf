// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upsert_studio_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpsertStudioRequest extends UpsertStudioRequest {
  @override
  final String displayName;
  @override
  final String? slug;
  @override
  final BuiltList<ExternalIdRef>? externalIds;

  factory _$UpsertStudioRequest([
    void Function(UpsertStudioRequestBuilder)? updates,
  ]) => (UpsertStudioRequestBuilder()..update(updates))._build();

  _$UpsertStudioRequest._({
    required this.displayName,
    this.slug,
    this.externalIds,
  }) : super._();
  @override
  UpsertStudioRequest rebuild(
    void Function(UpsertStudioRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpsertStudioRequestBuilder toBuilder() =>
      UpsertStudioRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpsertStudioRequest &&
        displayName == other.displayName &&
        slug == other.slug &&
        externalIds == other.externalIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpsertStudioRequest')
          ..add('displayName', displayName)
          ..add('slug', slug)
          ..add('externalIds', externalIds))
        .toString();
  }
}

class UpsertStudioRequestBuilder
    implements Builder<UpsertStudioRequest, UpsertStudioRequestBuilder> {
  _$UpsertStudioRequest? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  ListBuilder<ExternalIdRef>? _externalIds;
  ListBuilder<ExternalIdRef> get externalIds =>
      _$this._externalIds ??= ListBuilder<ExternalIdRef>();
  set externalIds(ListBuilder<ExternalIdRef>? externalIds) =>
      _$this._externalIds = externalIds;

  UpsertStudioRequestBuilder() {
    UpsertStudioRequest._defaults(this);
  }

  UpsertStudioRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _slug = $v.slug;
      _externalIds = $v.externalIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpsertStudioRequest other) {
    _$v = other as _$UpsertStudioRequest;
  }

  @override
  void update(void Function(UpsertStudioRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpsertStudioRequest build() => _build();

  _$UpsertStudioRequest _build() {
    _$UpsertStudioRequest _$result;
    try {
      _$result =
          _$v ??
          _$UpsertStudioRequest._(
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'UpsertStudioRequest',
              'displayName',
            ),
            slug: slug,
            externalIds: _externalIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'externalIds';
        _externalIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UpsertStudioRequest',
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

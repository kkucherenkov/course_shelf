// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upsert_tag_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpsertTagRequest extends UpsertTagRequest {
  @override
  final String displayName;
  @override
  final String? slug;
  @override
  final String? category;
  @override
  final BuiltList<ExternalIdRef>? externalIds;

  factory _$UpsertTagRequest([
    void Function(UpsertTagRequestBuilder)? updates,
  ]) => (UpsertTagRequestBuilder()..update(updates))._build();

  _$UpsertTagRequest._({
    required this.displayName,
    this.slug,
    this.category,
    this.externalIds,
  }) : super._();
  @override
  UpsertTagRequest rebuild(void Function(UpsertTagRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpsertTagRequestBuilder toBuilder() =>
      UpsertTagRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpsertTagRequest &&
        displayName == other.displayName &&
        slug == other.slug &&
        category == other.category &&
        externalIds == other.externalIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, externalIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpsertTagRequest')
          ..add('displayName', displayName)
          ..add('slug', slug)
          ..add('category', category)
          ..add('externalIds', externalIds))
        .toString();
  }
}

class UpsertTagRequestBuilder
    implements Builder<UpsertTagRequest, UpsertTagRequestBuilder> {
  _$UpsertTagRequest? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  ListBuilder<ExternalIdRef>? _externalIds;
  ListBuilder<ExternalIdRef> get externalIds =>
      _$this._externalIds ??= ListBuilder<ExternalIdRef>();
  set externalIds(ListBuilder<ExternalIdRef>? externalIds) =>
      _$this._externalIds = externalIds;

  UpsertTagRequestBuilder() {
    UpsertTagRequest._defaults(this);
  }

  UpsertTagRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _slug = $v.slug;
      _category = $v.category;
      _externalIds = $v.externalIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpsertTagRequest other) {
    _$v = other as _$UpsertTagRequest;
  }

  @override
  void update(void Function(UpsertTagRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpsertTagRequest build() => _build();

  _$UpsertTagRequest _build() {
    _$UpsertTagRequest _$result;
    try {
      _$result =
          _$v ??
          _$UpsertTagRequest._(
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'UpsertTagRequest',
              'displayName',
            ),
            slug: slug,
            category: category,
            externalIds: _externalIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'externalIds';
        _externalIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UpsertTagRequest',
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

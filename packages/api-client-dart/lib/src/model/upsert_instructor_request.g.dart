// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upsert_instructor_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpsertInstructorRequest extends UpsertInstructorRequest {
  @override
  final String displayName;
  @override
  final String? slug;
  @override
  final BuiltList<ExternalIdRef>? externalIds;

  factory _$UpsertInstructorRequest([
    void Function(UpsertInstructorRequestBuilder)? updates,
  ]) => (UpsertInstructorRequestBuilder()..update(updates))._build();

  _$UpsertInstructorRequest._({
    required this.displayName,
    this.slug,
    this.externalIds,
  }) : super._();
  @override
  UpsertInstructorRequest rebuild(
    void Function(UpsertInstructorRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpsertInstructorRequestBuilder toBuilder() =>
      UpsertInstructorRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpsertInstructorRequest &&
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
    return (newBuiltValueToStringHelper(r'UpsertInstructorRequest')
          ..add('displayName', displayName)
          ..add('slug', slug)
          ..add('externalIds', externalIds))
        .toString();
  }
}

class UpsertInstructorRequestBuilder
    implements
        Builder<UpsertInstructorRequest, UpsertInstructorRequestBuilder> {
  _$UpsertInstructorRequest? _$v;

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

  UpsertInstructorRequestBuilder() {
    UpsertInstructorRequest._defaults(this);
  }

  UpsertInstructorRequestBuilder get _$this {
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
  void replace(UpsertInstructorRequest other) {
    _$v = other as _$UpsertInstructorRequest;
  }

  @override
  void update(void Function(UpsertInstructorRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpsertInstructorRequest build() => _build();

  _$UpsertInstructorRequest _build() {
    _$UpsertInstructorRequest _$result;
    try {
      _$result =
          _$v ??
          _$UpsertInstructorRequest._(
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'UpsertInstructorRequest',
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
          r'UpsertInstructorRequest',
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
